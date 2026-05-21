const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionController');
const auth = require('../middleware/auth');

router.get('/', auth, controller.getTransactions);

module.exports = router;