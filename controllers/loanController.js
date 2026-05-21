const { pool } = require('../config/db');

const getLoans = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM loans WHERE user_id = ? ORDER BY next_due_date ASC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

const createLoan = async (req, res) => {
  try {
    const { lender_name, loan_type, principal_amount, interest_rate, emi_amount, start_date, end_date, next_due_date, notes } = req.body;
    const allowedLoanTypes = new Set(['home', 'car', 'education', 'personal', 'other']);

    const parsedPrincipal = Number(principal_amount);
    const parsedEMI = Number(emi_amount);
    const parsedInterest = interest_rate === '' || interest_rate == null ? 0 : Number(interest_rate);

    if (!lender_name || !next_due_date) {
      return res.status(400).json({ success: false, message: 'Lender name and next due date are required.' });
    }

    if (!Number.isFinite(parsedPrincipal) || parsedPrincipal <= 0) {
      return res.status(400).json({ success: false, message: 'Principal amount must be greater than 0.' });
    }

    if (!Number.isFinite(parsedEMI) || parsedEMI <= 0) {
      return res.status(400).json({ success: false, message: 'EMI amount must be greater than 0.' });
    }

    if (!Number.isFinite(parsedInterest) || parsedInterest < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate must be 0 or greater.' });
    }

    const normalizedLoanType = allowedLoanTypes.has(loan_type) ? loan_type : 'personal';
    const normalizedStartDate = start_date || next_due_date;
    const normalizedEndDate = end_date ? end_date : null;
    const normalizedNotes = notes ? String(notes).trim() : null;

    const [result] = await pool.query(
      'INSERT INTO loans (user_id, lender_name, loan_type, principal_amount, interest_rate, emi_amount, start_date, end_date, next_due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        lender_name,
        normalizedLoanType,
        parsedPrincipal,
        parsedInterest,
        parsedEMI,
        normalizedStartDate,
        normalizedEndDate,
        next_due_date,
        normalizedNotes
      ]
    );
    const [newRow] = await pool.query('SELECT * FROM loans WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Loan added.', data: newRow[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

const payEMI = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method = 'bank_transfer' } = req.body;
    const [rows] = await pool.query('SELECT * FROM loans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Loan not found.' });

    const loan = rows[0];
    const newTotalPaid = parseFloat(loan.total_paid) + parseFloat(loan.emi_amount);

    // Calculate next due date (next month same day)
    const nextDue = new Date(loan.next_due_date);
    nextDue.setMonth(nextDue.getMonth() + 1);

    await pool.query(
      'UPDATE loans SET total_paid = ?, next_due_date = ? WHERE id = ?',
      [newTotalPaid, nextDue.toISOString().split('T')[0], id]
    );
    await pool.query(
      'INSERT INTO payment_history (user_id, reference_type, reference_id, amount_paid, payment_date, payment_method) VALUES (?, ?, ?, ?, CURDATE(), ?)',
      [req.user.id, 'loan', id, loan.emi_amount, payment_method]
    );
    res.json({ success: true, message: 'EMI paid. Next due date updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

const deleteLoan = async (req, res) => {
  try {
    await pool.query('DELETE FROM loans WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Loan deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getLoans, createLoan, payEMI, deleteLoan };
