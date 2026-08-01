const db = require('../config/db');
const { generateOrderNumber, generateCounterCode, priceForCategory } = require('../utils/helpers');
const { validatePromoCode, recordPromoUsage } = require('../utils/promoEngine');
const { emitNewOrder, emitOrderUpdate } = require('../sockets/index');

// Public: customer places an order from their cart
async function placeOrder(req, res) {
  const { tableNumber, items, paymentMethod, customerPhone, customerName, promoCode } = req.body;

  if (!tableNumber || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Table number and at least one cart item are required' });
  }
  if (!['online', 'counter'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Payment method must be online or counter' });
  }

  try {
    const [tableRows] = await db.query(
      'SELECT * FROM restaurant_tables WHERE table_number = ? AND is_active = 1',
      [tableNumber]
    );
    const table = tableRows[0];
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const menuItemIds = items.map((i) => i.menuItemId);
    const [menuRows] = await db.query(
      `SELECT * FROM menu_items WHERE id IN (${menuItemIds.map(() => '?').join(',')}) AND is_available = 1`,
      menuItemIds
    );
    const menuById = Object.fromEntries(menuRows.map((m) => [m.id, m]));

    let subtotal = 0;
    const lineItems = [];
    for (const cartLine of items) {
      const menuItem = menuById[cartLine.menuItemId];
      if (!menuItem) {
        return res.status(400).json({ error: `An item in your cart is no longer available. Please refresh the menu.` });
      }
      const qty = Math.max(1, parseInt(cartLine.quantity, 10) || 1);
      const unitPrice = priceForCategory(menuItem, table.category);
      const lineSubtotal = unitPrice * qty;
      subtotal += lineSubtotal;
      lineItems.push({ menuItemId: menuItem.id, name: menuItem.name, unitPrice, qty, lineSubtotal });
    }

    let discount = 0;
    let promocodeId = null;
    if (promoCode) {
      const result = await validatePromoCode(promoCode, subtotal, customerPhone);
      if (!result.valid) {
        return res.status(400).json({ error: result.message });
      }
      discount = result.discount;
      promocodeId = result.promocodeId;
    }

    const [[settings]] = await db.query('SELECT tax_percent FROM shop_settings WHERE id = 1');
    const taxPercent = settings ? Number(settings.tax_percent) : 0;
    const taxable = subtotal - discount;
    const tax = Math.round(((taxable * taxPercent) / 100) * 100) / 100;
    const total = Math.round((taxable + tax) * 100) / 100;

    const orderNumber = generateOrderNumber();
    const counterCode = paymentMethod === 'counter' ? generateCounterCode() : null;

    const [orderResult] = await db.query(
      `INSERT INTO orders
        (order_number, table_id, customer_phone, customer_name, status, payment_method, payment_status, counter_code, subtotal, discount, tax, total, promocode_id)
       VALUES (?, ?, ?, ?, 'placed', ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [orderNumber, table.id, customerPhone || null, customerName || null, paymentMethod, counterCode, subtotal, discount, tax, total, promocodeId]
    );
    const orderId = orderResult.insertId;

    for (const li of lineItems) {
      await db.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, li.menuItemId, li.name, li.unitPrice, li.qty, li.lineSubtotal]
      );
    }

    if (promocodeId) {
      await recordPromoUsage(promocodeId, customerPhone, orderId);
    }

    const fullOrder = await fetchOrderWithItems(orderId);
    emitNewOrder(fullOrder);

    res.status(201).json({ order: fullOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not place order' });
  }
}

async function fetchOrderWithItems(orderId) {
  const [[order]] = await db.query(
    `SELECT o.*, t.table_number, t.category as table_category FROM orders o
     JOIN restaurant_tables t ON t.id = o.table_id
     WHERE o.id = ?`,
    [orderId]
  );
  if (!order) return null;
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  return { ...order, items };
}

// Public: customer polls/subscribes to this for live tracking
async function getOrderByNumber(req, res) {
  const { orderNumber } = req.params;
  try {
    const [[order]] = await db.query(
      `SELECT o.*, t.table_number FROM orders o
       JOIN restaurant_tables t ON t.id = o.table_id
       WHERE o.order_number = ?`,
      [orderNumber]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    res.json({ ...order, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load order' });
  }
}

// Admin: kitchen/orders board — active orders
async function listActiveOrders(req, res) {
  try {
    const [orders] = await db.query(
      `SELECT o.*, t.table_number FROM orders o
       JOIN restaurant_tables t ON t.id = o.table_id
       WHERE o.status NOT IN ('completed','cancelled')
       ORDER BY o.created_at ASC`
    );
    for (const order of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load orders' });
  }
}

// Admin: full order history with basic pagination
async function listAllOrders(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = (page - 1) * limit;
  try {
    const [orders] = await db.query(
      `SELECT o.*, t.table_number FROM orders o
       JOIN restaurant_tables t ON t.id = o.table_id
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load order history' });
  }
}

async function getOrderById(req, res) {
  const { id } = req.params;
  try {
    const order = await fetchOrderWithItems(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load order' });
  }
}

// Admin: accept / mark preparing / mark served / complete / cancel
async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['placed', 'accepted', 'preparing', 'served', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  try {
    let finalStatus = status;
    // If the kitchen marks an order Served and it's already been paid for, there's
    // no reason to make staff take a separate "Complete & Bill" step - just finish it.
    if (status === 'served') {
      const [[existing]] = await db.query('SELECT payment_status FROM orders WHERE id = ?', [id]);
      if (existing && existing.payment_status === 'paid') {
        finalStatus = 'completed';
      }
    }
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [finalStatus, id]);
    const order = await fetchOrderWithItems(id);
    emitOrderUpdate(order);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update order status' });
  }
}

// Admin/counter: look up an order by its CNTR-xxxxxx code
async function getOrderByCounterCode(req, res) {
  const { code } = req.params;
  try {
    const [[order]] = await db.query(
      `SELECT o.*, t.table_number FROM orders o
       JOIN restaurant_tables t ON t.id = o.table_id
       WHERE o.counter_code = ?`,
      [code]
    );
    if (!order) return res.status(404).json({ error: 'No order found with that counter code' });
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    res.json({ ...order, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not look up counter code' });
  }
}

// Admin/counter: mark paid / declined, or switch the payment method (e.g. to cash)
async function updatePaymentStatus(req, res) {
  const { id } = req.params;
  const { payment_status, payment_method } = req.body;
  const allowedStatus = ['pending', 'paid', 'declined'];
  const allowedMethod = ['online', 'counter', 'cash'];
  if (payment_status && !allowedStatus.includes(payment_status)) {
    return res.status(400).json({ error: 'Invalid payment status' });
  }
  if (payment_method && !allowedMethod.includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }
  try {
    await db.query(
      `UPDATE orders SET
        payment_status = COALESCE(?, payment_status),
        payment_method = COALESCE(?, payment_method)
      WHERE id = ?`,
      [payment_status, payment_method, id]
    );

    // Mirror of the rule above: if payment comes in for an order that's already
    // been served, that order is done - complete it automatically.
    if (payment_status === 'paid') {
      const [[existing]] = await db.query('SELECT status FROM orders WHERE id = ?', [id]);
      if (existing && existing.status === 'served') {
        await db.query('UPDATE orders SET status = ? WHERE id = ?', ['completed', id]);
      }
    }

    const order = await fetchOrderWithItems(id);
    emitOrderUpdate(order);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update payment status' });
  }
}

module.exports = {
  placeOrder,
  getOrderByNumber,
  listActiveOrders,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderByCounterCode,
  updatePaymentStatus,
  fetchOrderWithItems
};
