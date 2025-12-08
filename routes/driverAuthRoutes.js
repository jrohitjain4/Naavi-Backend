const express = require('express');
const router = express.Router();
const {
    sendOtp,
    verifyOtp,
} = require('../controllers/driverAuthController');

// Send OTP (public)
router.post('/send-otp', sendOtp);

// Verify OTP (public)
router.post('/verify-otp', verifyOtp);

module.exports = router;

