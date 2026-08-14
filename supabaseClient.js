require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[supabase] Supabase client initialized with URL:', SUPABASE_URL);
  } catch (err) {
    console.error('[supabase] Initialization error:', err.message);
  }
} else {
  console.log('[supabase] SUPABASE_URL or SUPABASE_KEY not set. Operating in local JSON fallback mode.');
}

const DB_FILE = path.join(__dirname, 'data_orders.json');
const MAX_ORDERS = 500;

function readLocalOrders() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('[supabase] readLocalOrders error:', err.message);
  }
  return [
    { id: 'ORD-1001', paymentId: 'pay_P892104921', name: 'Vikrant Sharma', phone: '9876543210', email: 'vikrant@sadhnaayurveda.com', address: 'Madhuwala, Dehradun, Uttarakhand - 248007', itemsList: 'Sadhna Madhu Shant x 1', finalAmount: 3500, payMethod: 'razorpay', status: 'Pending Approval', stockAvailable: true, awbNumber: 'SR849201948', timestamp: new Date().toLocaleString('en-IN') },
    { id: 'ORD-1002', paymentId: 'COD-7729103', name: 'Anjali Verma', phone: '9718179397', email: 'anjali@gmail.com', address: 'Sector 62, Noida, UP - 201301', itemsList: 'Sadhna Liver Detox Juice x 2', finalAmount: 7000, payMethod: 'cod', status: 'Approved', stockAvailable: true, awbNumber: 'SR992018234', timestamp: new Date().toLocaleString('en-IN') }
  ];
}

function writeLocalOrders(orders) {
  try {
    const safe = Array.isArray(orders) ? orders.slice(0, MAX_ORDERS) : [];
    fs.writeFileSync(DB_FILE, JSON.stringify(safe, null, 2), 'utf8');
  } catch (err) {
    console.error('[supabase] writeLocalOrders error:', err.message);
  }
}

function dbRowToOrder(row) {
  return {
    id: row.id,
    paymentId: row.payment_id,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    address: row.address || '',
    itemsList: row.items_list,
    finalAmount: Number(row.final_amount) || 0,
    payMethod: row.pay_method,
    status: row.status,
    stockAvailable: row.stock_available ?? true,
    awbNumber: row.awb_number || '',
    rejectionReason: row.rejection_reason || null,
    timestamp: row.created_at ? new Date(row.created_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')
  };
}

function isSupabaseConfigured() {
  return supabase !== null;
}

async function fetchOrders() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[supabase] fetchOrders error:', error.message);
      } else if (data) {
        return data.map(dbRowToOrder);
      }
    } catch (err) {
      console.error('[supabase] fetchOrders exception:', err.message);
    }
  }
  return readLocalOrders();
}

async function insertOrder(orderData) {
  if (supabase) {
    try {
      const dbPayload = {
        id: orderData.id,
        payment_id: orderData.paymentId,
        name: orderData.name,
        phone: orderData.phone,
        email: orderData.email,
        address: orderData.address,
        items_list: orderData.itemsList,
        final_amount: orderData.finalAmount,
        pay_method: orderData.payMethod,
        status: orderData.status || 'Pending Approval',
        stock_available: orderData.stockAvailable ?? true,
        awb_number: orderData.awbNumber || null
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([dbPayload])
        .select()
        .single();

      if (error) {
        console.error('[supabase] insertOrder error:', error.message);
      } else if (data) {
        const createdOrder = dbRowToOrder(data);
        // Sync local cache
        const local = readLocalOrders();
        local.unshift(createdOrder);
        writeLocalOrders(local);
        return createdOrder;
      }
    } catch (err) {
      console.error('[supabase] insertOrder exception:', err.message);
    }
  }

  // Fallback to local JSON
  const local = readLocalOrders();
  local.unshift(orderData);
  writeLocalOrders(local);
  return orderData;
}

async function approveOrder(orderId) {
  const awbNumber = 'SR' + Math.floor(100000000 + Math.random() * 900000000);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'Approved',
          stock_available: true,
          awb_number: awbNumber,
          updated_at: new Date().toISOString()
        })
        .or(`id.eq.${orderId},payment_id.eq.${orderId}`)
        .select()
        .single();

      if (error) {
        console.error('[supabase] approveOrder error:', error.message);
      } else if (data) {
        const updated = dbRowToOrder(data);
        // Sync local file
        const local = readLocalOrders();
        const idx = local.findIndex(o => o.id === orderId || o.paymentId === orderId);
        if (idx !== -1) { local[idx] = updated; writeLocalOrders(local); }
        return updated;
      }
    } catch (err) {
      console.error('[supabase] approveOrder exception:', err.message);
    }
  }

  // Local fallback
  const local = readLocalOrders();
  const idx = local.findIndex(o => o.id === orderId || o.paymentId === orderId);
  if (idx === -1) return null;
  local[idx].status = 'Approved';
  local[idx].stockAvailable = true;
  if (!local[idx].awbNumber) local[idx].awbNumber = awbNumber;
  writeLocalOrders(local);
  return local[idx];
}

async function rejectOrder(orderId, reason) {
  const safeReason = (reason || 'Item out of stock').slice(0, 300);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'Out of Stock / Rejected',
          stock_available: false,
          rejection_reason: safeReason,
          updated_at: new Date().toISOString()
        })
        .or(`id.eq.${orderId},payment_id.eq.${orderId}`)
        .select()
        .single();

      if (error) {
        console.error('[supabase] rejectOrder error:', error.message);
      } else if (data) {
        const updated = dbRowToOrder(data);
        const local = readLocalOrders();
        const idx = local.findIndex(o => o.id === orderId || o.paymentId === orderId);
        if (idx !== -1) { local[idx] = updated; writeLocalOrders(local); }
        return updated;
      }
    } catch (err) {
      console.error('[supabase] rejectOrder exception:', err.message);
    }
  }

  // Local fallback
  const local = readLocalOrders();
  const idx = local.findIndex(o => o.id === orderId || o.paymentId === orderId);
  if (idx === -1) return null;
  local[idx].status = 'Out of Stock / Rejected';
  local[idx].stockAvailable = false;
  local[idx].rejectionReason = safeReason;
  writeLocalOrders(local);
  return local[idx];
}

async function updateOrderStatus(orderId, status, awbNumber) {
  const updates = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (awbNumber !== undefined) updates.awb_number = awbNumber;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .or(`id.eq.${orderId},payment_id.eq.${orderId}`)
        .select()
        .single();

      if (error) {
        console.error('[supabase] updateOrderStatus error:', error.message);
      } else if (data) {
        const updated = dbRowToOrder(data);
        const local = readLocalOrders();
        const idx = local.findIndex(o => o.id === orderId || o.paymentId === orderId);
        if (idx !== -1) { local[idx] = updated; writeLocalOrders(local); }
        return updated;
      }
    } catch (err) {
      console.error('[supabase] updateOrderStatus exception:', err.message);
    }
  }

  // Local fallback
  const local = readLocalOrders();
  const idx = local.findIndex(o => o.id === orderId || o.paymentId === orderId);
  if (idx === -1) return null;
  if (status !== undefined) local[idx].status = status;
  if (awbNumber !== undefined) local[idx].awbNumber = awbNumber;
  writeLocalOrders(local);
  return local[idx];
}

async function getAdminStats() {
  const orders = await fetchOrders();
  const totalRevenue = orders.reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);
  return {
    totalRevenue,
    totalOrders: orders.length,
    pendingApproval: orders.filter(o => o.status === 'Pending Approval').length,
    approvedOrders: orders.filter(o => ['Approved', 'Shipped', 'Delivered'].includes(o.status)).length,
    outOfStockOrders: orders.filter(o => o.status === 'Out of Stock / Rejected').length
  };
}

module.exports = {
  isSupabaseConfigured,
  fetchOrders,
  insertOrder,
  approveOrder,
  rejectOrder,
  updateOrderStatus,
  getAdminStats,
  readLocalOrders
};
