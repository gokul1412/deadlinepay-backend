const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController');
const auth = require('../middleware/auth');

router.post('/generate', auth, controller.generate);
router.post('/', auth, controller.saveBudget);

module.exports = router;