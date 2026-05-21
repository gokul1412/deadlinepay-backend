const { pool } = require('../config/db');
const parseCSV = require('../services/csvParser');
const parsePDF = require('../services/pdfParser'); // ✅ NEW
const categorize = require('../services/categorizer');

exports.uploadStatement = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname.toLowerCase();

    let rows = [];

    // ✅ HANDLE FILE TYPE
    if (fileName.endsWith('.csv')) {
      rows = await parseCSV(filePath);

    } else if (fileName.endsWith('.pdf')) {
      rows = await parsePDF(filePath);

    } else {
      return res.status(400).json({
        success: false,
        message: 'Only CSV or PDF files supported'
      });
    }

    let insertedCount = 0;

    // ✅ PROCESS ROWS
    for (let row of rows) {

      // 🔥 Normalize fields (works for both CSV + PDF)
      const rawDate =
        row.Date ||
        row.date ||
        row['Transaction Date'] ||
        row['Txn Date'] ||
        row['Posting Date'] ||
        row.date;

      const desc =
        row.Description ||
        row.description ||
        row.Narration ||
        row.desc ||
        '';

      const rawAmount =
        row.Amount ||
        row.amount ||
        row.Debit ||
        row.Credit ||
        row.value ||
        0;

      const amount = parseFloat(rawAmount);

      // ❌ Skip invalid rows
      if (!rawDate || isNaN(amount)) {
        continue;
      }

      // ✅ Convert date safely
      const parsedDate = new Date(rawDate);

      if (isNaN(parsedDate)) {
        continue;
      }

      const finalDate = parsedDate.toISOString().split('T')[0];

      const categoryId = categorize(desc);

      await pool.query(
        `INSERT INTO transactions 
        (user_id, transaction_date, description, amount, transaction_type, category_id, is_categorized)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          finalDate,
          desc,
          Math.abs(amount),
          amount > 0 ? 'credit' : 'debit',
          categoryId,
          categoryId ? true : false
        ]
      );

      insertedCount++;
    }

    res.json({
      success: true,
      message: 'File processed successfully',
      inserted: insertedCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }
};