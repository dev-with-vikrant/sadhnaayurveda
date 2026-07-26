const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-Memory Database File Path for persistent storage
const DB_FILE = path.join(__dirname, 'data_orders.json');

// Helper to read orders from DB
function readOrders() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error reading DB_FILE:', err);
  }
  return [
    {
      id: 'ORD-1001',
      paymentId: 'pay_P892104921',
      name: 'Vikrant Sharma',
      phone: '9876543210',
      email: 'vikrant@sadhnaayurveda.com',
      address: 'Madhuwala, Dehradun, Uttarakhand - 248007',
      itemsList: 'Sadhna Madhu Shant (Diabetes Care) x 1',
      finalAmount: 3500,
      payMethod: 'razorpay',
      status: 'Pending Approval',
      stockAvailable: true,
      awbNumber: 'SR849201948',
      timestamp: new Date().toLocaleString('en-IN')
    },
    {
      id: 'ORD-1002',
      paymentId: 'COD-7729103',
      name: 'Anjali Verma',
      phone: '9718179397',
      email: 'anjali@gmail.com',
      address: 'Sector 62, Noida, Uttar Pradesh - 201301',
      itemsList: 'Sadhna Liver Detox Juice x 2',
      finalAmount: 7000,
      payMethod: 'cod',
      status: 'Approved',
      stockAvailable: true,
      awbNumber: 'SR992018234',
      timestamp: new Date().toLocaleString('en-IN')
    }
  ];
}

// Helper to write orders to DB
function writeOrders(orders) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB_FILE:', err);
  }
}

// Seed DB on start if missing
if (!fs.existsSync(DB_FILE)) {
  writeOrders(readOrders());
}

// ================= API ENDPOINTS =================

// 1. GET /api/orders - Fetch all orders
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json({ success: true, count: orders.length, orders });
});

// 2. POST /api/orders - Submit new customer order from checkout
app.post('/api/orders', (req, res) => {
  const { name, phone, email, address, itemsList, finalAmount, payMethod, paymentId } = req.body;

  if (!name || !phone || !itemsList) {
    return res.status(400).json({ success: false, message: 'Missing required order details.' });
  }

  const orders = readOrders();
  const orderId = 'ORD-' + (Math.floor(1000 + Math.random() * 9000));
  const awbNumber = 'SR' + (Math.floor(100000000 + Math.random() * 900000000));

  const newOrder = {
    id: orderId,
    paymentId: paymentId || 'COD-' + Math.floor(100000 + Math.random() * 900000),
    name,
    phone,
    email: email || 'customer@sadhnaayurveda.com',
    address,
    itemsList,
    finalAmount: Number(finalAmount) || 0,
    payMethod: payMethod || 'cod',
    status: 'Pending Approval', // Default status requiring admin approval
    stockAvailable: true,
    awbNumber,
    timestamp: new Date().toLocaleString('en-IN')
  };

  orders.unshift(newOrder);
  writeOrders(orders);

  console.log(`📦 New Order Received: ${newOrder.id} - ${newOrder.name}`);
  res.status(201).json({ success: true, message: 'Order submitted successfully and sent to Admin Approval Queue!', order: newOrder });
});

// 3. PUT /api/orders/:id/approve - Admin Approve Order
app.put('/api/orders/:id/approve', (req, res) => {
  const orderId = req.params.id;
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === orderId || o.paymentId === orderId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  orders[index].status = 'Approved';
  orders[index].stockAvailable = true;
  if (!orders[index].awbNumber) {
    orders[index].awbNumber = 'SR' + (Math.floor(100000000 + Math.random() * 900000000));
  }

  writeOrders(orders);
  console.log(`✅ Order Approved by Admin: ${orders[index].id}`);
  res.json({ success: true, message: `Order #${orders[index].id} approved successfully!`, order: orders[index] });
});

// 4. PUT /api/orders/:id/reject - Admin Reject / Mark Out of Stock
app.put('/api/orders/:id/reject', (req, res) => {
  const orderId = req.params.id;
  const { reason } = req.body;
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === orderId || o.paymentId === orderId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  orders[index].status = 'Out of Stock / Rejected';
  orders[index].stockAvailable = false;
  orders[index].rejectionReason = reason || 'Item out of stock in warehouse';

  writeOrders(orders);
  console.log(`❌ Order Rejected / Out of Stock: ${orders[index].id}`);
  res.json({ success: true, message: `Order #${orders[index].id} marked as Out of Stock / Rejected!`, order: orders[index] });
});

// 5. PUT /api/orders/:id/status - Update Order Status & AWB
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = req.params.id;
  const { status, awbNumber } = req.body;
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === orderId || o.paymentId === orderId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (status) orders[index].status = status;
  if (awbNumber) orders[index].awbNumber = awbNumber;

  writeOrders(orders);
  res.json({ success: true, message: 'Order updated successfully!', order: orders[index] });
});

// 6. GET /api/admin/stats - Live Admin Analytics
app.get('/api/admin/stats', (req, res) => {
  const orders = readOrders();
  const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  const totalOrders = orders.length;
  const pendingApproval = orders.filter(o => o.status === 'Pending Approval').length;
  const approvedOrders = orders.filter(o => o.status === 'Approved' || o.status === 'Shipped' || o.status === 'Delivered').length;
  const outOfStockOrders = orders.filter(o => o.status === 'Out of Stock / Rejected').length;

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders,
      pendingApproval,
      approvedOrders,
      outOfStockOrders
    }
  });
});

// Route for dedicated admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve static frontend files
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`🌿 Sadhna Ayurveda Node.js Server running at http://localhost:${PORT}`);
  console.log(`🔐 Dedicated Admin Dashboard available at http://localhost:${PORT}/admin`);
});
