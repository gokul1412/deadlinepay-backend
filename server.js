const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const { testConnection, pool } = require('./config/db');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://deadlinepay.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/deadlines', require('./routes/deadlines'));
app.use('/api/income', require('./routes/income'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/bank', require('./routes/bank'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DeadlinePay API is running 🚀' });
});

// Cron: Daily check for overdue items and send notifications (runs at 8am every day)
cron.schedule('0 8 * * *', async () => {
  try {
    // Mark overdue deadlines
    await pool.query(
      `UPDATE deadlines SET status = 'overdue' WHERE due_date < CURDATE() AND status = 'pending'`
    );

    // Create notifications for items due in reminder_days
    const [upcoming] = await pool.query(
      `SELECT d.*, u.id as user_id FROM deadlines d
       JOIN users u ON d.user_id = u.id
       WHERE d.due_date = DATE_ADD(CURDATE(), INTERVAL d.reminder_days DAY)
       AND d.status IN ('pending', 'partially_paid')`
    );

    for (const item of upcoming) {
      await pool.query(
        'INSERT INTO notifications (user_id, message, type, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
        [item.user_id, `Reminder: "${item.title}" is due on ${item.due_date}`, 'reminder', 'deadline', item.id]
      );
    }

    console.log(`[CRON] Overdue updated. ${upcoming.length} reminders sent.`);
  } catch (err) {
    console.error('[CRON] Error:', err.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 DeadlinePay server running on port ${PORT}`);
  await testConnection();
});

module.exports = app;
