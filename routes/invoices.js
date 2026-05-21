const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getInvoices, createInvoice, updateInvoice, markInvoicePaid, deleteInvoice } = require('../controllers/invoiceController');

router.get('/', auth, getInvoices);
router.post('/', auth, createInvoice);
router.put('/:id', auth, updateInvoice);
router.patch('/:id/pay', auth, markInvoicePaid);
router.delete('/:id', auth, deleteInvoice);

module.exports = router;
