const express = require('express');
const multer = require('multer');
const { processAudio } = require('../controllers/connectorController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

router.post('/process', upload.single('audio'), processAudio);

module.exports = router;
