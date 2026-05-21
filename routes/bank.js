const express = require('express');
const router = express.Router();
const multer = require('multer');
const bankController = require('../controllers/bankController');
const auth = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', auth, upload.single('file'), bankController.uploadStatement);

module.exports = router;