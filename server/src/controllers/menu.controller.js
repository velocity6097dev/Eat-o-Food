const db = require('../config/db');
const { isWithinTimeWindow, priceForCategory } = require('../utils/helpers');

// Public: customer-facing menu, grouped by category, priced for the table's category,
// filtered to items that are marked available AND within their time window right now.
async function getPublicMenu(req, res) {
  const tableCategory = req.query.tableCategory || 'medium';
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order, name'
    );
    const [items] = await db.query('SELECT * FROM menu_items WHERE is_available = 1');

    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const menu = categories.map((cat) => {
      const catItems = items
        .filter((it) => it.category_id === cat.id)
        .filter((it) => isWithinTimeWindow(it.available_from, it.available_to))
        .map((it) => ({
          id: it.id,
          name: it.name,
          description: it.description,
          image_url: it.image_url,
          is_seasonal: !!it.is_seasonal,
          available_from: it.available_from,
          available_to: it.available_to,
          price: priceForCategory(it, tableCategory)
        }));
      return { id: cat.id, name: cat.name, items: catItems };
    }).filter((cat) => cat.items.length > 0);

    res.json({ menu, servedAt: nowTime });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load menu' });
  }
}

// Admin: full list including unavailable items, all three prices
async function listAllMenuItems(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT mi.*, c.name as category_name FROM menu_items mi
       JOIN categories c ON c.id = mi.category_id
       ORDER BY c.display_order, mi.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load menu items' });
  }
}

async function createMenuItem(req, res) {
  const {
    category_id, name, description,
    price_high, price_medium, price_low,
    is_seasonal, available_from, available_to
  } = req.body;

  if (!category_id || !name) {
    return res.status(400).json({ error: 'Category and item name are required' });
  }

  const image_url = req.file ? `/uploads/menu/${req.file.filename}` : '';

  try {
    const [result] = await db.query(
      `INSERT INTO menu_items
        (category_id, name, description, price_high, price_medium, price_low, image_url, is_seasonal, available_from, available_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id, name, description || '',
        price_high || 0, price_medium || 0, price_low || 0,
        image_url, is_seasonal ? 1 : 0,
        available_from || null, available_to || null
      ]
    );
    res.status(201).json({ id: result.insertId, image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create menu item' });
  }
}

async function updateMenuItem(req, res) {
  const { id } = req.params;
  const {
    category_id, name, description,
    price_high, price_medium, price_low,
    is_seasonal, available_from, available_to, is_available
  } = req.body;

  try {
    const fields = [
      'category_id = COALESCE(?, category_id)',
      'name = COALESCE(?, name)',
      'description = COALESCE(?, description)',
      'price_high = COALESCE(?, price_high)',
      'price_medium = COALESCE(?, price_medium)',
      'price_low = COALESCE(?, price_low)',
      'is_seasonal = COALESCE(?, is_seasonal)',
      'available_from = ?',
      'available_to = ?',
      'is_available = COALESCE(?, is_available)'
    ];
    const values = [
      category_id, name, description,
      price_high, price_medium, price_low,
      is_seasonal !== undefined ? (is_seasonal ? 1 : 0) : undefined,
      available_from || null, available_to || null,
      is_available !== undefined ? (is_available ? 1 : 0) : undefined
    ];

    if (req.file) {
      fields.push('image_url = ?');
      values.push(`/uploads/menu/${req.file.filename}`);
    }

    values.push(id);
    await db.query(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update menu item' });
  }
}

// Quick toggle used by the "Mark as not available" button
async function setAvailability(req, res) {
  const { id } = req.params;
  const { is_available } = req.body;
  try {
    await db.query('UPDATE menu_items SET is_available = ? WHERE id = ?', [is_available ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update availability' });
  }
}

async function deleteMenuItem(req, res) {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM menu_items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete menu item' });
  }
}

module.exports = {
  getPublicMenu,
  listAllMenuItems,
  createMenuItem,
  updateMenuItem,
  setAvailability,
  deleteMenuItem
};
