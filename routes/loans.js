const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getLoans, createLoan, payEMI, deleteLoan } = require('../controllers/loanController');

router.get('/', auth, getLoans);
router.post('/', auth, createLoan);
router.patch('/:id/pay-emi', auth, payEMI);
router.delete('/:id', auth, deleteLoan);

module.exports = router;
