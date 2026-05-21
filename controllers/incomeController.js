const { pool } = require('../config/db');

// Get all income
const getIncome = async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = 'SELECT * FROM income_sources WHERE user_id = ?';
    const params = [req.user.id];

    if (month && year) {
      query += ' AND MONTH(received_date) = ? AND YEAR(received_date) = ?';
      params.push(month, year);
    }
    query += ' ORDER BY received_date DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Get monthly income summary
const getMonthlySummary = async (req, res) => {
  try {
    const [income] = await pool.query(
      `SELECT SUM(amount) as total_income FROM income_sources 
       WHERE user_id = ? AND MONTH(received_date) = MONTH(CURDATE()) AND YEAR(received_date) = YEAR(CURDATE())`,
      [req.user.id]
    );
    const [obligations] = await pool.query(
      `SELECT SUM(amount) as total_obligations FROM deadlines 
       WHERE user_id = ? AND MONTH(due_date) = MONTH(CURDATE()) AND YEAR(due_date) = YEAR(CURDATE())
       AND status IN ('pending', 'partially_paid', 'overdue')`,
      [req.user.id]
    );
    const [loans] = await pool.query(
      `SELECT SUM(emi_amount) as total_emi FROM loans WHERE user_id = ? AND status = 'active'`,
      [req.user.id]
    );

    const totalIncome = parseFloat(income[0].total_income) || 0;
    const totalObligations = parseFloat(obligations[0].total_obligations) || 0;
    const totalEMI = parseFloat(loans[0].total_emi) || 0;
    const totalDue = totalObligations + totalEMI;
    const freeBalance = totalIncome - totalDue;

    res.json({
      success: true,
      data: { totalIncome, totalObligations, totalEMI, totalDue, freeBalance }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Add income
const addIncome = async (req, res) => {
  try {
    const { title, type, amount, received_date, is_recurring, recurrence, notes } = req.body;
    const [result] = await pool.query(
      'INSERT INTO income_sources (user_id, title, type, amount, received_date, is_recurring, recurrence, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, type || 'salary', amount, received_date, is_recurring || false, recurrence || 'monthly', notes]
    );
    const [newRow] = await pool.query('SELECT * FROM income_sources WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Income added.', data: newRow[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Update income
const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, amount, received_date, notes } = req.body;
    await pool.query(
      'UPDATE income_sources SET title=?, type=?, amount=?, received_date=?, notes=? WHERE id=? AND user_id=?',
      [title, type, amount, received_date, notes, id, req.user.id]
    );
    res.json({ success: true, message: 'Income updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

// Delete income
const deleteIncome = async (req, res) => {
  try {
    await pool.query('DELETE FROM income_sources WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Income deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getIncome, getMonthlySummary, addIncome, updateIncome, deleteIncome };
