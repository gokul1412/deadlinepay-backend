const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDeadlines, getUpcoming, createDeadline, updateDeadline, markPaid, deleteDeadline } = require('../controllers/deadlineController');

router.get('/', auth, getDeadlines);
router.get('/upcoming', auth, getUpcoming);
router.post('/', auth, createDeadline);
router.put('/:id', auth, updateDeadline);
router.patch('/:id/pay', auth, markPaid);
router.delete('/:id', auth, deleteDeadline);

module.exports = router;
