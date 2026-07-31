const db = require('../config/db');

async function getSettings(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM shop_settings WHERE id = 1');
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load shop settings' });
  }
}

async function updateSettings(req, res) {
  const { name, address, phone, opening_time, closing_time, theme_color, accent_color, tax_percent, logo_url } = req.body;
  try {
    await db.query(
      `UPDATE shop_settings SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        opening_time = COALESCE(?, opening_time),
        closing_time = COALESCE(?, closing_time),
        theme_color = COALESCE(?, theme_color),
        accent_color = COALESCE(?, accent_color),
        tax_percent = COALESCE(?, tax_percent),
        logo_url = COALESCE(?, logo_url)
      WHERE id = 1`,
      [name, address, phone, opening_time, closing_time, theme_color, accent_color, tax_percent, logo_url]
    );
    const [rows] = await db.query('SELECT * FROM shop_settings WHERE id = 1');
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update shop settings' });
  }
}

module.exports = { getSettings, updateSettings };
