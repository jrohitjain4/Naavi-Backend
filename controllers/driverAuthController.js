const Driver = require('../models/Driver');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-12345';

// Temporary OTP store (in production, use Redis)
const otpStore = {};

// Send OTP for driver login/registration
exports.sendOtp = async (req, res) => {
    try {
        const { mobileNo } = req.body;

        if (!mobileNo || mobileNo.length !== 10) {
            return res.status(400).json({ message: 'Valid 10-digit mobile number is required' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP
        otpStore[mobileNo] = otp;

        // If driver exists, update OTP in database
        const existingDriver = await Driver.findOne({ mobileNo });
        if (existingDriver) {
            existingDriver.otp = otp;
            existingDriver.otpExpiry = otpExpiry;
            await existingDriver.save();
        }

        console.log(`OTP for ${mobileNo} is: ${otp}. (Or use dummy OTP: 123456)`);

        res.status(200).json({
            message: 'OTP sent successfully',
            otpExpiry: otpExpiry,
            // In production, don't send OTP in response
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify OTP and login/register driver
exports.verifyOtp = async (req, res) => {
    try {
        const { mobileNo, otp } = req.body;

        if (!mobileNo || !otp) {
            return res.status(400).json({ message: 'Mobile number and OTP are required' });
        }

        // Check OTP (allow dummy OTP 123456 for testing)
        const storedOtp = otpStore[mobileNo];
        const isValidOtp = otp === '123456' || otp === storedOtp;

        if (!isValidOtp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if driver exists
        let driver = await Driver.findOne({ mobileNo });

        if (driver) {
            // Driver exists - check status
            if (driver.status === 'Pending') {
                return res.status(200).json({
                    message: 'Account pending approval',
                    status: 'pending',
                    driver: {
                        _id: driver._id,
                        mobileNo: driver.mobileNo,
                        status: driver.status,
                    },
                });
            }

            if (driver.status === 'Rejected') {
                return res.status(403).json({
                    message: 'Account has been rejected. Please contact admin.',
                    status: 'rejected',
                });
            }

            if (driver.status === 'Approved' && driver.isActive) {
                // Generate token for approved driver
                const token = jwt.sign(
                    { id: driver._id, type: 'driver' },
                    JWT_SECRET,
                    { expiresIn: '30d' }
                );

                // Clear OTP
                delete otpStore[mobileNo];
                driver.otp = null;
                driver.otpExpiry = null;
                await driver.save();

                return res.status(200).json({
                    message: 'Login successful',
                    token,
                    driver: {
                        _id: driver._id,
                        driverId: driver.driverId,
                        firstName: driver.firstName,
                        lastName: driver.lastName,
                        mobileNo: driver.mobileNo,
                        status: driver.status,
                        isActive: driver.isActive,
                    },
                    isNewUser: false,
                });
            }
        } else {
            // New user - OTP verified successfully
            // Driver record will be created in completeProfile endpoint
            // Clear OTP
            delete otpStore[mobileNo];

            return res.status(200).json({
                message: 'OTP verified successfully. Please complete your registration.',
                status: 'otp_verified',
                isNewUser: true,
                mobileNo: mobileNo,
            });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


