const Driver = require('../models/Driver');
const Zone = require('../models/Zone');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Driver ID
const generateDriverId = async () => {
    try {
        const lastDriver = await Driver.findOne({ driverId: { $exists: true, $ne: null } })
            .sort({ driverId: -1 });
        if (!lastDriver || !lastDriver.driverId) {
            return 'DRIVER-001';
        }
        const lastNumber = parseInt(lastDriver.driverId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        return `DRIVER-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        return `DRIVER-${Date.now().toString().slice(-3)}`;
    }
};

// Complete driver profile (Step 1)
exports.completeProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            address,
            mobileNo,
            password,
            zoneId,
        } = req.body;

        // Validation
        if (!firstName || !lastName || !address || !mobileNo || !password || !zoneId) {
            return res.status(400).json({
                message: 'All fields are required: firstName, lastName, address, mobileNo, password, zoneId',
            });
        }

        // Find driver by ID from token or mobile number
        let driver;
        if (req.driver && req.driver._id) {
            driver = await Driver.findById(req.driver._id);
        } else {
            driver = await Driver.findOne({ mobileNo });
        }

        // If driver doesn't exist, create new one (for new registration)
        if (!driver) {
            const driverId = await generateDriverId();
            driver = new Driver({
                driverId,
                mobileNo,
                status: 'Pending',
                isActive: false,
            });
        }

        // Check if driver is already approved (can't change profile after approval)
        if (driver.status === 'Approved' && driver.isActive) {
            return res.status(403).json({
                message: 'Cannot modify profile after approval. Contact admin for changes.',
            });
        }

        // Validate zone exists
        const zone = await Zone.findById(zoneId);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }

        // Handle file uploads (assuming multer middleware handles files)
        const aadharCard = req.files?.aadharCard?.[0]?.path || req.body.aadharCard || driver.aadharCard;
        const panCard = req.files?.panCard?.[0]?.path || req.body.panCard || driver.panCard;
        const boatDrivingLicense = req.files?.boatDrivingLicense?.[0]?.path || req.body.boatDrivingLicense || driver.boatDrivingLicense;

        // Update driver profile
        driver.firstName = firstName;
        driver.lastName = lastName;
        driver.address = address;
        driver.mobileNo = mobileNo;
        driver.password = password; // Will be hashed by pre-save hook
        driver.zoneId = zoneId;
        driver.zoneName = zone.zoneName;
        driver.aadharCard = aadharCard;
        driver.panCard = panCard;
        driver.boatDrivingLicense = boatDrivingLicense;
        driver.status = 'Pending'; // Ensure status is pending
        driver.isActive = false;

        await driver.save();

        // Create audit log
        await createAuditLog({
            user: driver.mobileNo || 'Driver',
            email: null,
            userId: driver._id.toString(),
            action: 'Completed Driver Profile',
            module: 'Driver Registration',
            details: `${driver.driverId} - ${firstName} ${lastName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: driver._id.toString(),
            entityType: 'Driver',
        });

        res.status(200).json({
            message: 'Profile completed successfully. Please register your boat.',
            driver: {
                _id: driver._id,
                driverId: driver.driverId,
                firstName: driver.firstName,
                lastName: driver.lastName,
                mobileNo: driver.mobileNo,
                status: driver.status,
                zoneId: driver.zoneId,
                zoneName: driver.zoneName,
            },
        });
    } catch (error) {
        console.error('Error completing profile:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get driver profile
exports.getProfile = async (req, res) => {
    try {
        const driverId = req.driver?._id || req.params.id;

        if (!driverId) {
            return res.status(400).json({ message: 'Driver ID is required' });
        }

        const driver = await Driver.findById(driverId)
            .populate('zoneId', 'zoneId zoneName')
            .populate('associatedBoatId', 'boatId boatType boatNumber');

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json({
            driver: {
                _id: driver._id,
                driverId: driver.driverId,
                firstName: driver.firstName,
                lastName: driver.lastName,
                address: driver.address,
                mobileNo: driver.mobileNo,
                zoneId: driver.zoneId,
                zoneName: driver.zoneName,
                status: driver.status,
                isActive: driver.isActive,
                aadharCard: driver.aadharCard,
                panCard: driver.panCard,
                boatDrivingLicense: driver.boatDrivingLicense,
                associatedBoatId: driver.associatedBoatId,
            },
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

