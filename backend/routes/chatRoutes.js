const express = require('express');
const { generateChatResponse } = require('../controllers/chatController');

const router = express.Router();
console.log('chatRoutes.js is loaded');
router.post('/', generateChatResponse);

module.exports = router;
