const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const db = require('../config/db');
const { fetchOrderWithItems } = require('./orders.controller');
const { emitOrderUpdate } = require('../sockets/index');
require('dotenv').config();

// Public: create a Razorpay order for an existing DB order, right before checkout
async function createRazorpayOrder(req, res) {
  const { orderId } = req.body;
  try {
    const order = await fetchOrderWithItems(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.payment_method !== 'online') {
      return res.status(400).json({ error: 'This order is not set up for online payment' });
    }

    const rpOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100), // paise
      currency: 'INR',
      receipt: order.order_number
    });

    await db.query('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [rpOrder.id, orderId]);

    res.json({
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderNumber: order.order_number
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not initiate payment' });
  }
}

// Public: verify the payment signature Razorpay's checkout widget returns
async function verifyPayment(req, res) {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  try {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await db.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['declined', orderId]);
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    await db.query(
      'UPDATE orders SET payment_status = ?, razorpay_payment_id = ? WHERE id = ?',
      ['paid', razorpay_payment_id, orderId]
    );

    const order = await fetchOrderWithItems(orderId);
    emitOrderUpdate(order);
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not verify payment' });
  }
}

module.exports = { createRazorpayOrder, verifyPayment };
