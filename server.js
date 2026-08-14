require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const db = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 8080;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '439824053286-pvb6vo9dggccn2dhsqbk91a72ru77qs4.apps.googleusercontent.com';

// Enable Gzip/Brotli compression for fast text transfers
app.use(compression());

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

const PHONE_REGEX = /^[6-9][0-9]{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = new Set(['Pending Approval', 'Approved', 'Shipped', 'Delivered', 'Out of Stock / Rejected']);

app.get('/api/config', (_req, res) => res.json({ success: true, googleClientId: GOOGLE_CLIENT_ID, supabaseConnected: db.isSupabaseConfigured() }));

app.get('/api/orders', async (_req, res) => {
  try {
    const orders = await db.fetchOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('[server] GET /api/orders error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

app.post('/api/orders', rateLimiter(60000, 10), async (req, res) => {
  const { name, phone, email, address, itemsList, finalAmount, payMethod, paymentId } = req.body || {};
  if (!name || !phone || !itemsList) return res.status(400).json({ success: false, message: 'Missing required fields: name, phone, itemsList.' });
  if (!PHONE_REGEX.test((phone || '').trim())) return res.status(400).json({ success: false, message: 'Invalid Indian phone number.' });
  if (email && !EMAIL_REGEX.test((email || '').trim())) return res.status(400).json({ success: false, message: 'Invalid email address.' });

  const safeAmount = Math.max(0, Number(finalAmount) || 0);
  const safePayMethod = payMethod === 'razorpay' ? 'razorpay' : 'cod';
  const existingOrders = await db.fetchOrders();
  const orderId = 'ORD-' + String(1000 + existingOrders.length).padStart(4, '0') + '-' + Date.now().toString(36).toUpperCase();
  
  const orderPayload = {
    id: orderId,
    paymentId: sanitizeStr(paymentId) || (safePayMethod === 'cod' ? 'COD-' + Math.floor(100000 + Math.random() * 900000) : orderId),
    name: sanitizeStr(name, 100),
    phone: sanitizeStr(phone, 15),
    email: sanitizeStr(email || 'customer@sadhnaayurveda.com', 150),
    address: sanitizeStr(address, 300),
    itemsList: sanitizeStr(itemsList, 500),
    finalAmount: safeAmount,
    payMethod: safePayMethod,
    status: 'Pending Approval',
    stockAvailable: true,
    awbNumber: 'SR' + Math.floor(100000000 + Math.random() * 900000000),
    timestamp: new Date().toLocaleString('en-IN')
  };

  try {
    const newOrder = await db.insertOrder(orderPayload);
    console.log('[server] New Order created:', newOrder.id, newOrder.name);
    return res.status(201).json({ success: true, message: 'Order submitted!', order: newOrder });
  } catch (err) {
    console.error('[server] POST /api/orders error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create order.' });
  }
});

app.put('/api/orders/:id/approve', async (req, res) => {
  const orderId = sanitizeStr(req.params.id, 60);
  try {
    const updated = await db.approveOrder(orderId);
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found.' });
    return res.json({ success: true, message: 'Order approved!', order: updated });
  } catch (err) {
    console.error('[server] PUT /api/orders/:id/approve error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to approve order.' });
  }
});

app.put('/api/orders/:id/reject', async (req, res) => {
  const orderId = sanitizeStr(req.params.id, 60);
  const { reason } = req.body || {};
  try {
    const updated = await db.rejectOrder(orderId, sanitizeStr(reason || 'Item out of stock', 300));
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found.' });
    return res.json({ success: true, message: 'Order rejected!', order: updated });
  } catch (err) {
    console.error('[server] PUT /api/orders/:id/reject error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to reject order.' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const orderId = sanitizeStr(req.params.id, 60);
  const { status, awbNumber } = req.body || {};
  if (status !== undefined && !VALID_STATUSES.has(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }
  try {
    const updated = await db.updateOrderStatus(orderId, status, awbNumber ? sanitizeStr(awbNumber, 50) : undefined);
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found.' });
    return res.json({ success: true, message: 'Order updated!', order: updated });
  } catch (err) {
    console.error('[server] PUT /api/orders/:id/status error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

app.get('/api/admin/stats', async (_req, res) => {
  try {
    const stats = await db.getAdminStats();
    return res.json({ success: true, stats });
  } catch (err) {
    console.error('[server] GET /api/admin/stats error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.use(express.static(__dirname, {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));


app.use((err, _req, res, _next) => {
  console.error('[server] Error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log('Sadhna Ayurveda Server at http://localhost:' + PORT);
});
