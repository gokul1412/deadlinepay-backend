const db = require('../config/db');
const generateBudget = require('../services/budgetEngine');

exports.generate = async (req, res) => {
  const { income } = req.body;

  const result = generateBudget(income);

  res.json(result);
};

exports.saveBudget = async (req, res) => {
  const userId = req.user.id;
  const { income, allocations } = req.body;

  const [budget] = await db.query(
    `INSERT INTO budgets (user_id, month, total_income) VALUES (?, YEAR(NOW()), ?)`,
    [userId, income]
  );

  const budgetId = budget.insertId;

  for (let item of allocations) {
    await db.query(
      `INSERT INTO budget_allocations 
      (budget_id, category_id, allocated_amount)
      VALUES (?, ?, ?)`,
      [budgetId, item.category_id, item.amount]
    );
  }

  res.json({ message: 'Budget saved' });
};