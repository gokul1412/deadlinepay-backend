const { pool } = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Monthly income
    const [income] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM income_sources 
       WHERE user_id = ? 
       AND MONTH(received_date) = MONTH(CURDATE()) 
       AND YEAR(received_date) = YEAR(CURDATE())`,
      [userId]
    );

    // 2️⃣ Deadlines (monthly obligations)
    const [obligations] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM deadlines 
       WHERE user_id = ? 
       AND MONTH(due_date) = MONTH(CURDATE()) 
       AND YEAR(due_date) = YEAR(CURDATE())`,
      [userId]
    );

    // 3️⃣ Loan EMIs
    const [emi] = await pool.query(
      `SELECT COALESCE(SUM(emi_amount), 0) as total 
       FROM loans 
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    // 4️⃣ NEW: Expenses from transactions
    const [expenses] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM transactions 
       WHERE user_id = ? 
       AND transaction_type = 'debit'
       AND MONTH(transaction_date) = MONTH(CURDATE())
       AND YEAR(transaction_date) = YEAR(CURDATE())`,
      [userId]
    );

    // 5️⃣ Overdue items
    const [overdue] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM deadlines 
       WHERE user_id = ? 
       AND due_date < CURDATE() 
       AND status IN ('pending', 'partially_paid')`,
      [userId]
    );

    // Update overdue status
    await pool.query(
      `UPDATE deadlines 
       SET status = 'overdue' 
       WHERE user_id = ? 
       AND due_date < CURDATE() 
       AND status = 'pending'`,
      [userId]
    );

    // 6️⃣ Upcoming deadlines (next 7 days)
    const [upcoming] = await pool.query(
      `SELECT * FROM deadlines 
       WHERE user_id = ? 
       AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
       AND status IN ('pending','partially_paid')
       ORDER BY due_date ASC 
       LIMIT 5`,
      [userId]
    );

    // 7️⃣ Pending invoices
    const [pendingInvoices] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
       FROM invoices 
       WHERE user_id = ? 
       AND status IN ('pending', 'overdue')`,
      [userId]
    );

    // 8️⃣ Monthly chart (last 6 months)
    const [monthlyChart] = await pool.query(
      `SELECT
         DATE_FORMAT(received_date, '%Y-%m') as month_key,
         DATE_FORMAT(received_date, '%b %Y') as month,
         SUM(amount) as income
       FROM income_sources
       WHERE user_id = ? 
       AND received_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month_key, month
       ORDER BY month_key ASC`,
      [userId]
    );

    // 9️⃣ NEW: Recent transactions
    const [recentTransactions] = await pool.query(
      `SELECT id, description, amount, transaction_type, transaction_date 
       FROM transactions 
       WHERE user_id = ?
       ORDER BY transaction_date DESC 
       LIMIT 5`,
      [userId]
    );

    // 🔢 Safe parsing
    const totalIncome = parseFloat(income[0].total) || 0;
    const totalObligations = parseFloat(obligations[0].total) || 0;
    const totalEMI = parseFloat(emi[0].total) || 0;
    const totalExpenses = parseFloat(expenses[0].total) || 0;

    const totalDue = totalObligations + totalEMI;

    // ✅ FIXED FORMULA (VERY IMPORTANT)
    const freeBalance = totalIncome - totalDue - totalExpenses;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalDue,
        totalExpenses,       // ✅ NEW
        freeBalance,
        overdueCount: overdue[0].count,
        upcomingDeadlines: upcoming,
        pendingInvoices: pendingInvoices[0],
        monthlyChart,
        recentTransactions   
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error.',
      error: err.message
    });
  }
};

module.exports = { getDashboardStats };