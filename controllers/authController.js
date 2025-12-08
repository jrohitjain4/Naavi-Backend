const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT Secret - use environment variable or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-12345';

// OTPs ko temporary store karne ke liye (real app mein Redis jaisa DB use hota hai)
const otpStore = {};

// Function to send OTP (abhi bhi console par print karega)
exports.sendOtp = async (req, res) => {
    const { mobileNumber } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`OTP for ${mobileNumber} is: ${otp}. (Or use dummy OTP: 123456)`);
    otpStore[mobileNumber] = otp;

    res.status(200).json({ message: 'OTP sent to console' });
};

// Function to verify OTP (DUMMY OTP WALA LOGIC YAHAN HAI)
exports.verifyOtp = async (req, res) => {
    const { mobileNumber, otp } = req.body;

    console.log('=== OTP Verification Request ===');
    console.log('Mobile Number:', mobileNumber);
    console.log('OTP Received:', otp);
    console.log('Stored OTP:', otpStore[mobileNumber]);
    console.log('Dummy OTP: 123456');

    // YEH HAI SPECIAL LOGIC: Ya to real OTP match kare ya dummy OTP
    if (otp !== '123456' && otpStore[mobileNumber] !== otp) {
        console.log('❌ OTP Verification Failed');
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    console.log('✅ OTP Verified Successfully');

    // OTP use hone ke baad delete kar do (dummy wale ko nahi)
    if (otpStore[mobileNumber] === otp) {
       delete otpStore[mobileNumber];
    }

    let user = await User.findOne({ mobileNumber });

    if (user) {
        // User pehle se hai, login karwa do
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ message: 'Login successful', token, user, isNewUser: false });
    } else {
        // Naya user hai, signup ke liye aage bhejo
        res.status(200).json({ message: 'OTP verified. Please complete registration.', isNewUser: true, mobileNumber });
    }
};

// Function to register a new user (Truecaller se aaya data yahan save hoga)
exports.registerUser = async (req, res) => {
    const { mobileNumber, firstName, lastName, email } = req.body;

    console.log('=== Registration Request ===');
    console.log('Mobile Number:', mobileNumber);
    console.log('First Name:', firstName);
    console.log('Last Name:', lastName);
    console.log('Email:', email);

    try {
        // Validation
        if (!mobileNumber) {
            return res.status(400).json({ message: 'Mobile number is required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser) {
            console.log('User already exists, logging in...');
            const token = jwt.sign({ id: existingUser._id }, JWT_SECRET, { expiresIn: '30d' });
            return res.status(200).json({ message: 'User already exists, logged in', token, user: existingUser });
        }

        // Create new user
        const newUser = new User({ 
            mobileNumber, 
            firstName: firstName || '', 
            lastName: lastName || '', 
            email: email || '' 
        });
        
        await newUser.save();
        console.log('User registered successfully:', newUser._id);
        
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '30d' });
        console.log('JWT Token generated successfully');
        res.status(201).json({ message: 'Registration successful', token, user: newUser });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }
        
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Function to logout user
exports.logout = async (req, res) => {
    try {
        // For JWT tokens, logout is handled client-side by removing the token
        // But we can log the logout action for audit purposes
        console.log('User logged out');
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};