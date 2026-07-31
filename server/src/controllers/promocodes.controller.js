const db = require('../config/db');
const { validatePromoCode } = require('../utils/promoEngine');

// Public: customer checks a code against their current cart total before checkout
async function checkPromoCode(req, res) {
  const { code, subtotal, customerPhone } = req.body;
  if (!code || subtotal === undefined) {
    return res.status(400).json({ error: 'Code and cart subtotal are required' });
  }
  try {
    const result = await validatePromoCode(code, subtotal, customerPhone);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not check promo code' });
  }
}

async function listPromoCodes(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM promocodes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load promo codes' });
  }
}

async function createPromoCode(req, res) {
  const {
    code, discount_type, discount_value, max_discount_amount, min_order_amount,
    first_n_customers, first_time_only, total_usage_limit, valid_from, valid_to
  } = req.body;

  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: 'Code, discount type, and discount value are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO promocodes
        (code, discount_type, discount_value, max_discount_amount, min_order_amount,
         first_n_customers, first_time_only, total_usage_limit, valid_from, valid_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(), discount_type, discount_value,
        max_discount_amount || null, min_order_amount || 0,
        first_n_customers || null, first_time_only ? 1 : 0,
        total_usage_limit || null, valid_from || null, valid_to || null
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A promo code with that name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not create promo code' });
  }
}

async function updatePromoCode(req, res) {
  const { id } = req.params;
  const {
    discount_type, discount_value, max_discount_amount, min_order_amount,
    first_n_customers, first_time_only, total_usage_limit, valid_from, valid_to, is_active
  } = req.body;
  try {
    await db.query(
      `UPDATE promocodes SET
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        max_discount_amount = ?,
        min_order_amount = COALESCE(?, min_order_amount),
        first_n_customers = ?,
        first_time_only = COALESCE(?, first_time_only),
        total_usage_limit = ?,
        valid_from = ?,
        valid_to = ?,
        is_active = COALESCE(?, is_active)
      WHERE id = ?`,
      [
        discount_type, discount_value, max_discount_amount ?? null, min_order_amount,
        first_n_customers ?? null, first_time_only !== undefined ? (first_time_only ? 1 : 0) : undefined,
        total_usage_limit ?? null, valid_from || null, valid_to || null, is_active, id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update promo code' });
  }
}

async function deletePromoCode(req, res) {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM promocodes WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete promo code' });
  }
}

module.exports = { checkPromoCode, listPromoCodes, createPromoCode, updatePromoCode, deletePromoCode };
