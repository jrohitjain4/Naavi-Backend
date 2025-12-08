const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-12345';

/**
 * Authentication middleware to verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token - continue without user (for public routes)
            return next();
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return next();
        }
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get admin user
        const admin = await Admin.findById(decoded.id);
        if (admin) {
            req.user = {
                _id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            };
        }
        
        next();
    } catch (error) {
        // Token invalid or expired - continue without user
        next();
    }
};

module.exports = {
    authenticate,
};

