require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const nodeFs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '439824053286-pvb6vo9dggccn2dhsqbk91a72ru77qs4.apps.googleusercontent.com';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080,https://sadhnaayurveda.com').split(',');
app.use(cors({ origin: (o, cb) => (!o || ALLOWED_ORIGINS.includes(o)) ? cb(null, true) : cb(new Error('CORS blocked')) }));
app.use(express.json({ limit: '50kb' }));

const rateLimitMap = new Map();
function rateLimiter(windowMs, max) {
  return (req, res, next) => {
    const ip = req.ip || 'unknown'; const now = Date.now();
    const e = rateLimitMap.get(ip) || { count: 0, start: now };
    if (now - e.start > windowMs) { e.count = 1; e.start = now; } else e.count++;
    rateLimitMap.set(ip, e);
    if (e.count > max) return res.status(429).json({ success: false, message: 'Too many requests.' });
    next();
  };
}

function sanitizeStr(val, maxLen = 500) {
  if (typeof val !== 'string') return '';
  return val.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

const DB_FILE = path.join(__dirname, 'data_orders.json');
const MAX_ORDERS = 500;

function readOrders() {
  try {
    if (nodeFs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(nodeFs.readFileSync(DB_FILE, 'utf8') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) { console.error('[server] readOrders:', err.message); }
  return [
    { id: 'ORD-1001', paymentId: 'pay_P892104921', name: 'Vikrant Sharma', phone: '9876543210', email: 'vikrant@sadhnaayurveda.com', address: 'Madhuwala, Dehradun, Uttarakhand - 248007', itemsList: 'Sadhna Madhu Shant x 1', finalAmount: 3500, payMethod: 'razorpay', status: 'Pending Approval', stockAvailable: true, awbNumber: 'SR849201948', timestamp: new Date().toLocaleString('en-IN') },
    { id: 'ORD-1002', paymentId: 'COD-7729103', name: 'Anjali Verma', phone: '9718179397', email: 'anjali@gmail.com', address: 'Sector 62, Noida, UP - 201301', itemsList: 'Sadhna Liver Detox Juice x 2', finalAmount: 7000, payMethod: 'cod', status: 'Approved', stockAvailable: true, awbNumber: 'SR992018234', timestamp: new Date().toLocaleString('en-IN') }
  ];
}

function writeOrders(orders) {
  try {
    const safe = Array.isArray(orders) ? orders.slice(0, MAX_ORDERS) : [];
    nodeFs.writeFileSync(DB_FILE, JSON.stringify(safe, null, 2), 'utf8');
  } catch (err) { console.error('[server] writeOrders:', err.message); }
}

if (!nodeFs.existsSync(DB_FILE)) writeOrders(readOrders());

const PHONE_REGEX = /^[6-9][0-9]{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(['Pending Approval', 'Approved', 'Shipped', 'Delivered', 'Out of Stock / Rejected']);

app.get('/api/config', (_req, res) => res.json({ success: true, googleClientId: GOOGLE_CLIENT_ID }));

app.get('/api/orders', (_req, res) => {
  const orders = readOrders();
  res.json({ success: true, count: orders.length, orders });
});

app.post('/api/orders', rateLimiter(60000, 10), (req, res) => {
  const { name, phone, email, address, itemsList, finalAmount, payMethod, paymentId } = req.body || {};
  if (!name || !phone || !itemsList) return res.status(400).json({ success: false, message: 'Missing required fields: name, phone, itemsList.' });
  if (!PHONE_REGEX.test((phone || '').trim())) return res.status(400).json({ success: false, message: 'Invalid Indian phone number.' });
  if (email && !EMAIL_REGEX.test((email || '').trim())) return res.status(400).json({ success: false, message: 'Invalid email address.' });

  const safeAmount = Math.max(0, Number(finalAmount) || 0);
  const safePayMethod = payMethod === 'razorpay' ? 'razorpay' : 'cod';
  const orders = readOrders();
  const orderId = 'ORD-' + String(1000 + orders.length).padStart(4, '0') + '-' + Date.now().toString(36).toUpperCase();
  const newOrder = {
    id: orderId,
    paymentId: sanitizeStr(paymentId) || (safePayMethod === 'cod' ? 'COD-' + Math.floor(100000 + Math.random() * 900000) : orderId),
    name: sanitizeStr(name, 100), phone: sanitizeStr(phone, 15),
    email: sanitizeStr(email || 'customer@sadhnaayurveda.com', 150),
    address: sanitizeStr(address, 300), itemsList: sanitizeStr(itemsList, 500),
    finalAmount: safeAmount, payMethod: safePayMethod,
    status: 'Pending Approval', stockAvailable: true,
    awbNumber: 'SR' + Math.floor(100000000 + Math.random() * 900000000),
    timestamp: new Date().toLocaleString('en-IN')
  };
  orders.unshift(newOrder);
  writeOrders(orders);
  console.log('[server] New Order:', newOrder.id, newOrder.name);
  return res.status(201).json({ success: true, message: 'Order submitted!', order: newOrder });
});

app.put('/api/orders/:id/approve', (req, res) => {
  const orderId = sanitizeStr(req.params.id, 60);
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === orderId || o.paymentId === orderId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Order not found.' });
  orders[idx].status = 'Approved'; orders[idx].stockAvailable = true;
  if (!orders[idx].awbNumber) orders[idx].awbNumber = 'SR' + Math.floor(100000000 + Math.random() * 900000000);
  writeOrders(orders);
  return res.json({ success: true, message: 'Order approved!', order: orders[idx] });
});

app.put('/api/orders/:id/reject', (req, res) => {
  const orderId = sanitizeStr(req.params.id, 60);
  const { reason } = req.body || {};
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === orderId || o.paymentId === orderId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Order not found.' });
  orders[idx].status = 'Out of Stock / Rejected'; orders[idx].stockAvailable = false;
  orders[idx].rejectionReason = sanitizeStr(reason || 'Item out of stock', 300);
  writeOrders(orders);
  return res.json({ success: true, message: 'Order rejected!', order: orders[idx] });
});

app.put('/api/orders/:id/status', (req, res) => {
  const orderId = sanitizeStr(req.params.id, 60);
  const { status, awbNumber } = req.body || {};
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === orderId || o.paymentId === orderId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (status !== undefined) {
    if (!VALID_STATUSES.has(status)) return res.status(400).json({ success: false, message: 'Invalid status value.' });
    orders[idx].status = status;
  }
  if (awbNumber !== undefined) orders[idx].awbNumber = sanitizeStr(awbNumber, 50);
  writeOrders(orders);
  return res.json({ success: true, message: 'Order updated!', order: orders[idx] });
});

app.get('/api/admin/stats', (_req, res) => {
  const orders = readOrders();
  const totalRevenue = orders.reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);
  return res.json({ success: true, stats: { totalRevenue, totalOrders: orders.length, pendingApproval: orders.filter(o => o.status === 'Pending Approval').length, approvedOrders: orders.filter(o => ['Approved','Shipped','Delivered'].includes(o.status)).length, outOfStockOrders: orders.filter(o => o.status === 'Out of Stock / Rejected').length } });
});

app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.use(express.static(__dirname));

app.use((err, _req, res, _next) => {
  console.error('[server] Error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log('Sadhna Ayurveda Server at http://localhost:' + PORT);
});
