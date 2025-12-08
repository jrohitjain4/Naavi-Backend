const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../middleware/auditLog');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-12345';

// Initialize default admin
const initializeDefaultAdmin = async () => {
    try {
        const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
        if (!existingAdmin) {
            const defaultAdmin = new Admin({
                email: 'admin@gmail.com',
                password: 'admin123',
                name: 'Admin User',
                role: 'admin',
            });
            await defaultAdmin.save();
            console.log('Default admin created: admin@gmail.com / admin123');
        }
    } catch (error) {
        console.error('Error initializing default admin:', error);
    }
};

// Initialize on module load
initializeDefaultAdmin();

// Admin login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '30d' });
        
        // Log login action
        await createAuditLog({
            user: admin.email,
            email: admin.email,
            userId: admin._id.toString(),
            action: 'Login',
            module: 'Authentication',
            details: 'Admin logged in',
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
        });
        
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                boardingPoints: admin.boardingPoints || [],
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get current admin
exports.getCurrentAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.status(200).json({
            id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            boardingPoints: admin.boardingPoints || [],
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

