const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-12345';

/**
 * Driver authentication middleware
 */
const authenticateDriver = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if it's a driver token
        if (decoded.type !== 'driver') {
            return res.status(403).json({ message: 'Invalid token type' });
        }
        
        // Get driver
        const driver = await Driver.findById(decoded.id);
        if (!driver) {
            return res.status(401).json({ message: 'Driver not found' });
        }
        
        // Check if driver is approved and active
        if (driver.status !== 'Approved' || !driver.isActive) {
            return res.status(403).json({
                message: 'Driver account is not approved or inactive',
                status: driver.status,
            });
        }
        
        // Attach driver to request
        req.driver = {
            _id: driver._id,
            driverId: driver.driverId,
            firstName: driver.firstName,
            lastName: driver.lastName,
            mobileNo: driver.mobileNo,
            status: driver.status,
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error('Driver auth error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Optional driver authentication (for profile completion before approval)
 */
const optionalDriverAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token - continue (for profile completion)
            return next();
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return next();
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.type === 'driver') {
            const driver = await Driver.findById(decoded.id);
            if (driver) {
                req.driver = {
                    _id: driver._id,
                    driverId: driver.driverId,
                    status: driver.status,
                };
            }
        }
        
        next();
    } catch (error) {
        // Continue without driver (for registration flow)
        next();
    }
};

module.exports = {
    authenticateDriver,
    optionalDriverAuth,
};

