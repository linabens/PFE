const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// Staff/admin login
router.post('/login', AuthController.login);

module.exports = router;
