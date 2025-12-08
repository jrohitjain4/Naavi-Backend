// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, registerUser, logout } = require('../controllers/authController');

// Route to send OTP
router.post('/send-otp', sendOtp);

// Route to verify OTP and login/signup
router.post('/verify-otp', verifyOtp);

// Route for completing registration
router.post('/register', registerUser);

// Route for logout
router.post('/logout', logout);

module.exports = router;