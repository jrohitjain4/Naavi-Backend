const express = require('express');
const router = express.Router();
const { login, getCurrentAdmin } = require('../controllers/adminController');

// Admin login
router.post('/login', login);

// Get current admin (protected route - add auth middleware later if needed)
router.get('/me', getCurrentAdmin);

module.exports = router;

