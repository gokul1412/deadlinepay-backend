const { pool } = require('../config/db');

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT t.*, c.name as category 
       FROM transactions t
       LEFT JOIN expense_categories c ON t.category_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC`,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};