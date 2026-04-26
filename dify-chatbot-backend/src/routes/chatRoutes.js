// chatRoutes.js — Routes du chatbot Luna

const express = require('express')
const router = express.Router()
const { chat } = require('../controllers/chatController')

// POST /api/chat
// Body: { message, tableId, cartItems, currentOrder, loyaltyPoints, history }
router.post('/', chat)

module.exports = router