// routes/income.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getIncome, getMonthlySummary, addIncome, updateIncome, deleteIncome } = require('../controllers/incomeController');

router.get('/', auth, getIncome);
router.get('/summary', auth, getMonthlySummary);
router.post('/', auth, addIncome);
router.put('/:id', auth, updateIncome);
router.delete('/:id', auth, deleteIncome);

module.exports = router;
