const Driver = require('../models/Driver');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Driver ID
const generateDriverId = async () => {
    try {
        // Find the last driver to get the highest number
        const lastDriver = await Driver.findOne({ driverId: { $exists: true, $ne: null } })
            .sort({ driverId: -1 });
        
        if (!lastDriver || !lastDriver.driverId) {
            // First driver
            return 'DRV-001';
        }
        
        // Extract number from last driver ID (e.g., "DRV-001" -> 1)
        const lastNumber = parseInt(lastDriver.driverId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        
        // Format as DRV-XXX (3 digits with leading zeros)
        return `DRV-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating driver ID:', error);
        // Fallback: use timestamp-based ID
        return `DRV-${Date.now().toString().slice(-3)}`;
    }
};

// Get all drivers
exports.getAllDrivers = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        
        const drivers = await Driver.find(query)
            .populate('zoneId', 'zoneId zoneName')
            .populate('associatedBoatId', 'boatId boatNumber boatType capacity state city ghatName zoneName status boatRegistrationPaper')
            .sort({ createdAt: -1 });
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get pending drivers
exports.getPendingDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({ status: 'Pending' })
            .populate('zoneId', 'zoneId zoneName')
            .populate('associatedBoatId', 'boatId boatNumber boatType capacity state city ghatName zoneName status boatRegistrationPaper')
            .sort({ createdAt: -1 });
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get driver statistics
exports.getDriverStats = async (req, res) => {
    try {
        const total = await Driver.countDocuments();
        const onDuty = await Driver.countDocuments({ status: 'On Duty' });
        const onTrip = await Driver.countDocuments({ status: 'On Trip' });
        const offDuty = await Driver.countDocuments({ status: 'Off Duty' });
        
        res.status(200).json({
            total,
            onDuty,
            onTrip,
            offDuty,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id)
            .populate('zoneId', 'zoneId zoneName')
            .populate('associatedBoatId', 'boatId boatNumber boatType capacity state city ghatName');
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        res.status(200).json(driver);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Approve driver
exports.approveDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Update status
        driver.status = 'Approved';
        driver.isActive = true;
        await driver.save();

        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Approved Driver',
            module: 'Drivers',
            details: `${driver.driverId} - ${driver.firstName} ${driver.lastName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: driver._id.toString(),
            entityType: 'Driver',
        });

        res.status(200).json({
            message: 'Driver approved successfully',
            driver: {
                _id: driver._id,
                driverId: driver.driverId,
                firstName: driver.firstName,
                lastName: driver.lastName,
                status: driver.status,
                isActive: driver.isActive,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reject driver
exports.rejectDriver = async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Update status
        driver.status = 'Rejected';
        driver.isActive = false;
        await driver.save();

        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Rejected Driver',
            module: 'Drivers',
            details: `${driver.driverId} - ${driver.firstName} ${driver.lastName}${rejectionReason ? ` - Reason: ${rejectionReason}` : ''}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: driver._id.toString(),
            entityType: 'Driver',
        });

        res.status(200).json({
            message: 'Driver rejected successfully',
            driver: {
                _id: driver._id,
                driverId: driver.driverId,
                firstName: driver.firstName,
                lastName: driver.lastName,
                status: driver.status,
                isActive: driver.isActive,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new driver
exports.createDriver = async (req, res) => {
    try {
        const { firstName, lastName, phone, email, zone, status, rating, totalTrips, earningsMonth } = req.body;
        
        // Generate driver ID automatically
        const driverId = await generateDriverId();
        
        const newDriver = new Driver({
            driverId,
            firstName,
            lastName,
            phone,
            email: email || '',
            zone,
            status: status || 'Off Duty',
            rating: rating || 0,
            totalTrips: totalTrips || 0,
            earningsMonth: earningsMonth || 0,
        });
        
        await newDriver.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Created Driver',
            module: 'Drivers',
            details: `${newDriver.driverId} - ${newDriver.firstName} ${newDriver.lastName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newDriver._id.toString(),
            entityType: 'Driver',
        });
        
        res.status(201).json({ message: 'Driver created successfully', driver: newDriver });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update driver
exports.updateDriver = async (req, res) => {
    try {
        const { firstName, lastName, phone, email, zone, status, rating, totalTrips, earningsMonth } = req.body;
        
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        
        // Update fields (driverId cannot be changed)
        driver.firstName = firstName || driver.firstName;
        driver.lastName = lastName || driver.lastName;
        driver.phone = phone || driver.phone;
        driver.email = email !== undefined ? email : driver.email;
        driver.zone = zone || driver.zone;
        driver.status = status || driver.status;
        driver.rating = rating !== undefined ? rating : driver.rating;
        driver.totalTrips = totalTrips !== undefined ? totalTrips : driver.totalTrips;
        driver.earningsMonth = earningsMonth !== undefined ? earningsMonth : driver.earningsMonth;
        
        await driver.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Driver',
            module: 'Drivers',
            details: `${driver.driverId} - ${driver.firstName} ${driver.lastName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: driver._id.toString(),
            entityType: 'Driver',
        });
        
        res.status(200).json({ message: 'Driver updated successfully', driver });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete driver
exports.deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Driver',
            module: 'Drivers',
            details: `${driver.driverId} - ${driver.firstName} ${driver.lastName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: driver._id.toString(),
            entityType: 'Driver',
        });
        
        await Driver.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Driver deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

