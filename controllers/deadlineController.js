const { pool } = require('../config/db');

// Get all deadlines for user
const getDeadlines = async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = 'SELECT * FROM deadlines WHERE user_id = ?';
    const params = [req.user.id];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY due_date ASC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Get upcoming deadlines (next 30 days)
const getUpcoming = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM deadlines 
       WHERE user_id = ? AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       AND status IN ('pending', 'partially_paid')
       ORDER BY due_date ASC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Create deadline
const createDeadline = async (req, res) => {
  try {
    const { title, category, amount, due_date, is_recurring, recurrence, reminder_days, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO deadlines (user_id, title, category, amount, due_date, is_recurring, recurrence, reminder_days, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, category, amount, due_date, is_recurring || false, recurrence || 'monthly', reminder_days || 3, notes]
    );
    const [newRow] = await pool.query('SELECT * FROM deadlines WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Deadline created.', data: newRow[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Update deadline
const updateDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const allowedFields = ['title', 'category', 'amount', 'due_date', 'status', 'paid_amount', 'is_recurring', 'recurrence', 'reminder_days', 'notes'];
    const updates = Object.keys(fields).filter(k => allowedFields.includes(k));

    if (updates.length === 0) return res.status(400).json({ success: false, message: 'No valid fields to update.' });

    const setClause = updates.map(k => `${k} = ?`).join(', ');
    const values = updates.map(k => fields[k]);
    values.push(id, req.user.id);

    await pool.query(`UPDATE deadlines SET ${setClause} WHERE id = ? AND user_id = ?`, values);
    res.json({ success: true, message: 'Deadline updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Mark as paid
const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method = 'bank_transfer', notes } = req.body;

    const [rows] = await pool.query('SELECT * FROM deadlines WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Deadline not found.' });

    const deadline = rows[0];
    await pool.query('UPDATE deadlines SET status = ?, paid_amount = ? WHERE id = ?', ['paid', deadline.amount, id]);

    await pool.query(
      'INSERT INTO payment_history (user_id, reference_type, reference_id, amount_paid, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, CURDATE(), ?, ?)',
      [req.user.id, 'deadline', id, deadline.amount, payment_method, notes]
    );

    res.json({ success: true, message: 'Marked as paid.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Delete deadline
const deleteDeadline = async (req, res) => {
  try {
    await pool.query('DELETE FROM deadlines WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Deadline deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getDeadlines, getUpcoming, createDeadline, updateDeadline, markPaid, deleteDeadline };
