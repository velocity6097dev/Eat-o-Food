const db = require('../config/db');
const { emitCategoriesUpdate, emitMenuUpdate } = require('../sockets/index');

async function listCategories(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY display_order, name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load categories' });
  }
}

async function createCategory(req, res) {
  const { name, display_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO categories (name, display_order) VALUES (?, ?)',
      [name, display_order || 0]
    );
    res.status(201).json({ id: result.insertId });
    emitCategoriesUpdate();
    emitMenuUpdate();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create category' });
  }
}

async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, display_order, is_active } = req.body;
  try {
    await db.query(
      `UPDATE categories SET
        name = COALESCE(?, name),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active)
      WHERE id = ?`,
      [name, display_order, is_active, id]
    );
    res.json({ success: true });
    emitCategoriesUpdate();
    emitMenuUpdate();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update category' });
  }
}

async function deleteCategory(req, res) {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true });
    emitCategoriesUpdate();
    emitMenuUpdate();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete category. Remove or move its menu items first.' });
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
