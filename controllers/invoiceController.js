const { pool } = require('../config/db');

const getInvoices = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM invoices WHERE user_id = ?';
    const params = [req.user.id];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY due_date ASC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { client_name, client_email, description, amount, due_date, invoice_number, notes } = req.body;
    const inv_number = invoice_number || `INV-${Date.now()}`;
    const [result] = await pool.query(
      'INSERT INTO invoices (user_id, client_name, client_email, description, amount, due_date, invoice_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, client_name, client_email, description, amount, due_date, inv_number, notes]
    );
    const [newRow] = await pool.query('SELECT * FROM invoices WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Invoice created.', data: newRow[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, client_email, description, amount, due_date, status, paid_amount, notes } = req.body;
    await pool.query(
      'UPDATE invoices SET client_name=?, client_email=?, description=?, amount=?, due_date=?, status=?, paid_amount=?, notes=? WHERE id=? AND user_id=?',
      [client_name, client_email, description, amount, due_date, status, paid_amount, notes, id, req.user.id]
    );
    res.json({ success: true, message: 'Invoice updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

const markInvoicePaid = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    const invoice = rows[0];
    await pool.query('UPDATE invoices SET status = ?, paid_amount = ? WHERE id = ?', ['paid', invoice.amount, id]);
    await pool.query(
      'INSERT INTO payment_history (user_id, reference_type, reference_id, amount_paid, payment_date, payment_method) VALUES (?, ?, ?, ?, CURDATE(), ?)',
      [req.user.id, 'invoice', id, invoice.amount, 'bank_transfer']
    );
    res.json({ success: true, message: 'Invoice marked as paid.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Invoice deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getInvoices, createInvoice, updateInvoice, markInvoicePaid, deleteInvoice };
