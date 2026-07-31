const db = require('../config/db');

/**
 * Validates a promo code against the current cart + customer, and returns the
 * discount to apply.
 *
 * Semantics (kept simple and explainable to a non-technical shop owner):
 *  - first_n_customers: promo is only valid while the TOTAL number of orders ever
 *    placed in the shop is below this number (e.g. "first 100 customers" launch promo).
 *  - first_time_only: promo only valid if the given phone number has no prior orders.
 *    Requires the customer to enter a phone number at checkout.
 *  - total_usage_limit / used_count: a hard cap on how many times this exact code
 *    can be redeemed in total.
 *  - min_order_amount: cart subtotal must meet this to qualify.
 *  - percentage discounts respect max_discount_amount if set (a cap).
 */
async function validatePromoCode(code, subtotal, customerPhone) {
  const [rows] = await db.query(
    'SELECT * FROM promocodes WHERE code = ? AND is_active = 1',
    [code]
  );
  const promo = rows[0];
  if (!promo) return { valid: false, message: 'Invalid promo code' };

  const now = new Date();
  if (promo.valid_from && now < new Date(promo.valid_from)) {
    return { valid: false, message: 'This promo code is not active yet' };
  }
  if (promo.valid_to && now > new Date(promo.valid_to)) {
    return { valid: false, message: 'This promo code has expired' };
  }
  if (promo.total_usage_limit !== null && promo.used_count >= promo.total_usage_limit) {
    return { valid: false, message: 'This promo code has reached its usage limit' };
  }
  if (Number(subtotal) < Number(promo.min_order_amount)) {
    return {
      valid: false,
      message: `Minimum order amount for this code is Rs. ${promo.min_order_amount}`
    };
  }

  if (promo.first_n_customers !== null) {
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');
    if (totalOrders >= promo.first_n_customers) {
      return { valid: false, message: 'This code was limited to our first customers and is no longer available' };
    }
  }

  if (promo.first_time_only) {
    if (!customerPhone) {
      return { valid: false, message: 'Enter your phone number to use this first-time-only code' };
    }
    const [[{ priorOrders }]] = await db.query(
      'SELECT COUNT(*) as priorOrders FROM orders WHERE customer_phone = ?',
      [customerPhone]
    );
    if (priorOrders > 0) {
      return { valid: false, message: 'This code is only valid for first-time customers' };
    }
  }

  let discount = 0;
  if (promo.discount_type === 'percentage') {
    discount = (Number(subtotal) * Number(promo.discount_value)) / 100;
    if (promo.max_discount_amount !== null) {
      discount = Math.min(discount, Number(promo.max_discount_amount));
    }
  } else {
    discount = Number(promo.discount_value);
  }
  discount = Math.min(discount, Number(subtotal));
  discount = Math.round(discount * 100) / 100;

  return { valid: true, discount, promocodeId: promo.id, message: 'Promo code applied' };
}

async function recordPromoUsage(promocodeId, customerPhone, orderId) {
  await db.query(
    'INSERT INTO promocode_usage (promocode_id, customer_phone, order_id) VALUES (?, ?, ?)',
    [promocodeId, customerPhone || null, orderId]
  );
  await db.query('UPDATE promocodes SET used_count = used_count + 1 WHERE id = ?', [promocodeId]);
}

module.exports = { validatePromoCode, recordPromoUsage };
