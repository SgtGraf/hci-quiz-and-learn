const express = require('express');
const multer = require('multer');
const { transcribeAudio } = require('../controllers/whisperController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Save uploaded files to 'uploads/'

router.post('/transcribe', upload.single('audio'), transcribeAudio);

module.exports = router;
