const Boat = require('../models/Boat');
const BoatType = require('../models/BoatType');
const Driver = require('../models/Driver');
const Zone = require('../models/Zone');
const Ghat = require('../models/Ghat');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Boat ID based on zone
const generateBoatId = async (zoneId) => {
    try {
        // Get zone info
        const zone = await Zone.findById(zoneId);
        if (!zone) {
            throw new Error('Zone not found');
        }

        // Extract zone number from zoneId (e.g., "ZONE-001" -> "001")
        const zoneNumber = zone.zoneId.replace('ZONE-', '').padStart(3, '0');

        // Find last boat in this zone
        const lastBoat = await Boat.findOne({ zoneId })
            .sort({ boatId: -1 });

        let boatNumber = 1;
        if (lastBoat && lastBoat.boatId) {
            // Extract number from last boat ID (e.g., "BOAT-ZONE001-001" -> 1)
            const match = lastBoat.boatId.match(/-(\d+)$/);
            if (match) {
                boatNumber = parseInt(match[1]) + 1;
            }
        }

        // Format: BOAT-ZONE001-001
        return `BOAT-ZONE${zoneNumber}-${String(boatNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating boat ID:', error);
        return `BOAT-${Date.now().toString().slice(-6)}`;
    }
};

// Register boat for driver (Step 2)
exports.registerBoat = async (req, res) => {
    try {
        const {
            boatTypeId, // Reference to admin-created boat type
            boatNumber, // Government Authority number
            state,
            city,
            ghatId,
            zoneId,
        } = req.body;

        // Get driver ID from token or request body
        const driverId = req.driver?._id || req.body.driverId;

        // Validation
        if (!boatTypeId || !boatNumber || !state || !city || !zoneId) {
            return res.status(400).json({
                message: 'All fields are required: boatTypeId, boatNumber, state, city, zoneId',
            });
        }

        // Validate boat type exists (admin-created boat type)
        const boatType = await BoatType.findById(boatTypeId);
        if (!boatType) {
            return res.status(404).json({ message: 'Boat type not found. Please select a valid boat type.' });
        }

        // Find driver
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Check if driver already has a boat
        if (driver.associatedBoatId) {
            return res.status(400).json({
                message: 'Driver already has an associated boat. Contact admin to change.',
            });
        }

        // Validate zone exists
        const zone = await Zone.findById(zoneId);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }

        // Check if driver and boat are in same zone
        if (driver.zoneId.toString() !== zoneId) {
            return res.status(400).json({
                message: 'Boat zone must match driver zone',
            });
        }

        // Validate ghat if provided
        let ghat = null;
        let ghatName = null;
        if (ghatId) {
            ghat = await Ghat.findById(ghatId);
            if (!ghat) {
                return res.status(404).json({ message: 'Ghat not found' });
            }
            // Verify ghat is in same zone
            if (ghat.zoneId.toString() !== zoneId) {
                return res.status(400).json({
                    message: 'Ghat must be in the same zone as boat',
                });
            }
            ghatName = ghat.ghatName;
        }

        // Check if boat number already exists
        const existingBoat = await Boat.findOne({ boatNumber });
        if (existingBoat) {
            return res.status(400).json({ message: 'Boat number already registered' });
        }

        // Handle boat registration paper upload
        const boatRegistrationPaper = req.files?.boatRegistrationPaper?.[0]?.path || req.body.boatRegistrationPaper;

        // Generate boat ID
        const boatId = await generateBoatId(zoneId);

        // Create boat using admin boat type's capacity and boatType name
        const newBoat = new Boat({
            boatId,
            boatTypeId: boatTypeId, // Link to admin-created boat type
            boatNumber,
            boatType: boatType.boatType, // Use admin boat type's name (e.g., "Small", "Medium", "Large")
            capacity: boatType.capacity, // Use admin boat type's capacity
            state,
            city,
            ghatId: ghatId || null,
            ghatName: ghatName || null,
            zoneId,
            zoneName: zone.zoneName,
            associatedDriverId: driverId,
            boatRegistrationPaper: boatRegistrationPaper || null,
            status: 'Pending', // Pending until admin approves
        });

        await newBoat.save();

        // Link boat to driver
        driver.associatedBoatId = newBoat._id;
        await driver.save();

        // Create audit log
        await createAuditLog({
            user: driver.mobileNo || 'Driver',
            email: null,
            userId: driver._id.toString(),
            action: 'Registered Boat',
            module: 'Driver Registration',
            details: `${driver.driverId} - Boat: ${boatNumber}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newBoat._id.toString(),
            entityType: 'Boat',
        });

        res.status(201).json({
            message: 'Boat registered successfully. Request submitted for admin approval.',
            boat: {
                _id: newBoat._id,
                boatId: newBoat.boatId,
                boatTypeId: newBoat.boatTypeId,
                boatNumber: newBoat.boatNumber,
                boatType: newBoat.boatType,
                capacity: newBoat.capacity,
                zoneId: newBoat.zoneId,
                zoneName: newBoat.zoneName,
                status: newBoat.status,
            },
            driver: {
                _id: driver._id,
                driverId: driver.driverId,
                status: driver.status,
            },
        });
    } catch (error) {
        console.error('Error registering boat:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Boat number already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get driver's boat
exports.getDriverBoat = async (req, res) => {
    try {
        const driverId = req.driver?._id || req.params.driverId;

        if (!driverId) {
            return res.status(400).json({ message: 'Driver ID is required' });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        if (!driver.associatedBoatId) {
            return res.status(404).json({ message: 'No boat registered for this driver' });
        }

        const boat = await Boat.findById(driver.associatedBoatId)
            .populate('zoneId', 'zoneId zoneName')
            .populate('ghatId', 'ghatId ghatName')
            .populate('associatedDriverId', 'driverId firstName lastName')
            .populate('boatTypeId', 'boatId boatType capacity');

        res.status(200).json({ boat });
    } catch (error) {
        console.error('Error fetching driver boat:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

