const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Customer ID
const generateCustomerId = async () => {
    try {
        // Find the last user with customerId to get the highest number
        const lastUser = await User.findOne({ customerId: { $exists: true, $ne: null } })
            .sort({ customerId: -1 });
        
        if (!lastUser || !lastUser.customerId) {
            // First customer
            return 'CUST-001';
        }
        
        // Extract number from last customer ID (e.g., "CUST-001" -> 1)
        const lastNumber = parseInt(lastUser.customerId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        
        // Format as CUST-XXX (3 digits with leading zeros)
        return `CUST-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating customer ID:', error);
        // Fallback: use timestamp-based ID
        return `CUST-${Date.now().toString().slice(-3)}`;
    }
};

// Add customerId to existing users (one-time migration)
const addCustomerIdsToExistingUsers = async () => {
    try {
        const usersWithoutId = await User.find({ 
            $or: [
                { customerId: { $exists: false } },
                { customerId: null }
            ]
        });
        
        for (const user of usersWithoutId) {
            if (!user.customerId) {
                user.customerId = await generateCustomerId();
                await user.save();
            }
        }
    } catch (error) {
        console.error('Error adding customer IDs:', error);
    }
};

// Get all customers (registered users)
exports.getAllCustomers = async (req, res) => {
    try {
        // Ensure all users have customerId
        await addCustomerIdsToExistingUsers();
        
        const customers = await User.find().sort({ customerId: 1 });
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
    try {
        const total = await User.countDocuments();
        
        // Active this month (registered in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeThisMonth = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        // New this week (registered in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newThisWeek = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        
        // Repeat customers (registered more than 30 days ago)
        const repeatCustomers = await User.countDocuments({
            createdAt: { $lt: thirtyDaysAgo }
        });
        
        res.status(200).json({
            total,
            activeThisMonth,
            newThisWeek,
            repeatCustomers,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single customer by ID
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await User.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update customer
exports.updateCustomer = async (req, res) => {
    try {
        const { firstName, lastName, email, mobileNumber } = req.body;
        
        const customer = await User.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        // Update fields (customerId cannot be changed)
        customer.firstName = firstName || customer.firstName;
        customer.lastName = lastName || customer.lastName;
        customer.email = email !== undefined ? email : customer.email;
        customer.mobileNumber = mobileNumber || customer.mobileNumber;
        
        await customer.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Customer',
            module: 'Customers',
            details: `${customer.customerId || customer.mobileNumber} - ${customer.firstName} ${customer.lastName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: customer._id.toString(),
            entityType: 'Customer',
        });
        
        res.status(200).json({ message: 'Customer updated successfully', customer });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Mobile number or email already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await User.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Customer',
            module: 'Customers',
            details: `${customer.customerId || customer.mobileNumber} - ${customer.firstName} ${customer.lastName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: customer._id.toString(),
            entityType: 'Customer',
        });
        
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

