const db = require('../config/db');

// Public: customer enters a table number, we check it exists & is active
async function checkTable(req, res) {
  const { tableNumber } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, table_number, seat_count, category FROM restaurant_tables WHERE table_number = ? AND is_active = 1',
      [tableNumber]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'That table number was not found. Please check and try again.' });
    }
    res.json({ table: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not verify table number' });
  }
}

async function listTables(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM restaurant_tables ORDER BY CAST(table_number AS UNSIGNED), table_number');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load tables' });
  }
}

async function createTable(req, res) {
  const { table_number, seat_count, category } = req.body;
  if (!table_number) return res.status(400).json({ error: 'Table number is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO restaurant_tables (table_number, seat_count, category) VALUES (?, ?, ?)',
      [table_number, seat_count || 2, category || 'medium']
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A table with that number already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not create table' });
  }
}

async function updateTable(req, res) {
  const { id } = req.params;
  const { table_number, seat_count, category, is_active } = req.body;
  try {
    await db.query(
      `UPDATE restaurant_tables SET
        table_number = COALESCE(?, table_number),
        seat_count = COALESCE(?, seat_count),
        category = COALESCE(?, category),
        is_active = COALESCE(?, is_active)
      WHERE id = ?`,
      [table_number, seat_count, category, is_active, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update table' });
  }
}

async function deleteTable(req, res) {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM restaurant_tables WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete table' });
  }
}

module.exports = { checkTable, listTables, createTable, updateTable, deleteTable };
