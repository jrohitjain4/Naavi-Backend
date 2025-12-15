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

        // Validation (zoneId is optional - will use driver's zone automatically)
        if (!boatTypeId || !boatNumber || !state || !city) {
            return res.status(400).json({
                message: 'All fields are required: boatTypeId, boatNumber, state, city',
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

        // Use driver's zone automatically (zoneId is optional in request)
        let finalZoneId = zoneId || driver.zoneId;
        
        // If zoneId provided but doesn't match driver's zone, use driver's zone
        if (zoneId && driver.zoneId.toString() !== zoneId.toString()) {
            // Use driver's zone automatically (override provided zoneId)
            finalZoneId = driver.zoneId;
        }

        // Validate zone exists
        const zone = await Zone.findById(finalZoneId);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }

        // Validate ghat if provided, otherwise use zone's first boarding point/ghat
        let finalGhatId = ghatId;
        let ghat = null;
        let ghatName = null;

        if (finalGhatId) {
            // If ghatId provided, validate it
            ghat = await Ghat.findById(finalGhatId);
            if (!ghat) {
                return res.status(404).json({ message: 'Ghat not found' });
            }
            // Verify ghat is in same zone
            if (ghat.zoneId.toString() !== finalZoneId.toString()) {
                return res.status(400).json({
                    message: 'Ghat must be in the same zone as driver',
                });
            }
            finalGhatId = ghat._id;
            ghatName = ghat.ghatName;
        } else {
            // If ghatId not provided, use zone's first ghat or first boarding point
            // First try to get first ghat from zone
            const zoneGhats = await Ghat.find({ zoneId: finalZoneId }).sort({ createdAt: 1 }).limit(1);
            
            if (zoneGhats.length > 0) {
                // Use first ghat from zone
                ghat = zoneGhats[0];
                finalGhatId = ghat._id;
                ghatName = ghat.ghatName;
            } else if (zone.boardingPoints && zone.boardingPoints.length > 0) {
                // If no ghat found, try to find ghat by boarding point name
                const firstBoardingPoint = zone.boardingPoints[0];
                const boardingPointGhat = await Ghat.findOne({ 
                    zoneId: finalZoneId,
                    ghatName: { $regex: new RegExp(firstBoardingPoint, 'i') }
                });
                
                if (boardingPointGhat) {
                    ghat = boardingPointGhat;
                    finalGhatId = boardingPointGhat._id;
                    ghatName = boardingPointGhat.ghatName;
                } else {
                    // Use first boarding point as ghat name if ghat doesn't exist
                    ghatName = firstBoardingPoint;
                    // ghatId will remain null, but ghatName will be set for display
                }
            } else {
                // If no boarding points, try to get any ghat from zone's ghats array
                if (zone.ghats && zone.ghats.length > 0) {
                    const firstGhatId = zone.ghats[0].ghatId;
                    const ghatFromZone = await Ghat.findOne({ ghatId: firstGhatId, zoneId: finalZoneId });
                    if (ghatFromZone) {
                        ghat = ghatFromZone;
                        finalGhatId = ghatFromZone._id;
                        ghatName = ghatFromZone.ghatName;
                    }
                }
            }
        }

        // Ensure zoneName is always set from driver's zone
        const finalZoneName = zone.zoneName || driver.zoneName;

        // Check if boat number already exists
        const existingBoat = await Boat.findOne({ boatNumber });
        if (existingBoat) {
            return res.status(400).json({ message: 'Boat number already registered' });
        }

        // Handle boat registration paper upload
        const boatRegistrationPaper = req.files?.boatRegistrationPaper?.[0]?.path || req.body.boatRegistrationPaper;

        // Generate boat ID using driver's zone
        const boatId = await generateBoatId(finalZoneId);

        // Create boat using admin boat type's capacity and boatType name
        const newBoat = new Boat({
            boatId,
            boatTypeId: boatTypeId, // Link to admin-created boat type
            boatNumber,
            boatType: boatType.boatType, // Use admin boat type's name (e.g., "Small", "Medium", "Large")
            capacity: boatType.capacity, // Use admin boat type's capacity
            state,
            city,
            ghatId: finalGhatId || null, // Use automatically assigned ghat or provided one
            ghatName: ghatName || null, // Use automatically assigned ghat name or provided one
            zoneId: finalZoneId, // Use driver's zone automatically
            zoneName: finalZoneName, // Ensure zoneName is always set
            associatedDriverId: driverId,
            boatRegistrationPaper: boatRegistrationPaper || null,
            status: 'Pending', // Pending until admin approves
        });

        await newBoat.save();

        // Link boat to driver
        driver.associatedBoatId = newBoat._id;
        driver.boatId = newBoat.boatId; // Save boat ID string
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

        // Populate boat with zone and ghat data for response
        const populatedBoat = await Boat.findById(newBoat._id)
            .populate('zoneId', 'zoneId zoneName')
            .populate('ghatId', 'ghatId ghatName')
            .populate('boatTypeId', 'boatId boatType capacity');

        // Build response with guaranteed zone and ghat data
        const boatResponse = {
            _id: populatedBoat._id,
            boatId: populatedBoat.boatId,
            boatTypeId: populatedBoat.boatTypeId,
            boatNumber: populatedBoat.boatNumber,
            boatType: populatedBoat.boatType,
            capacity: populatedBoat.capacity,
            state: populatedBoat.state,
            city: populatedBoat.city,
            zoneId: populatedBoat.zoneId ? {
                _id: populatedBoat.zoneId._id,
                zoneId: populatedBoat.zoneId.zoneId,
                zoneName: populatedBoat.zoneId.zoneName
            } : {
                _id: finalZoneId,
                zoneId: zone.zoneId,
                zoneName: finalZoneName
            },
            zoneName: populatedBoat.zoneName || finalZoneName || (populatedBoat.zoneId ? populatedBoat.zoneId.zoneName : driver.zoneName),
            ghatId: populatedBoat.ghatId ? {
                _id: populatedBoat.ghatId._id,
                ghatId: populatedBoat.ghatId.ghatId,
                ghatName: populatedBoat.ghatId.ghatName
            } : (finalGhatId ? {
                _id: finalGhatId,
                ghatId: ghat?.ghatId,
                ghatName: ghatName
            } : null),
            ghatName: populatedBoat.ghatName || ghatName || (populatedBoat.ghatId ? populatedBoat.ghatId.ghatName : null),
            status: populatedBoat.status,
        };
        
        res.status(201).json({
            message: 'Boat registered successfully. Request submitted for admin approval.',
            boat: boatResponse,
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

        if (!boat) {
            return res.status(404).json({ message: 'Boat not found' });
        }

        // Ensure zoneName and ghatName are set even if populate fails
        const boatObj = boat.toObject();
        
        // Ensure zoneName is always set
        if (!boatObj.zoneName) {
            if (boatObj.zoneId && typeof boatObj.zoneId === 'object') {
                boatObj.zoneName = boatObj.zoneId.zoneName || driver.zoneName;
            } else {
                boatObj.zoneName = driver.zoneName;
            }
        }
        
        // Ensure ghatName is set if ghatId exists
        if (!boatObj.ghatName && boatObj.ghatId) {
            if (typeof boatObj.ghatId === 'object') {
                boatObj.ghatName = boatObj.ghatId.ghatName;
            }
        }

        // Ensure zoneId object has zoneName
        if (boatObj.zoneId && typeof boatObj.zoneId === 'object' && !boatObj.zoneId.zoneName) {
            boatObj.zoneId.zoneName = boatObj.zoneName || driver.zoneName;
        }

        // Ensure ghatId object has ghatName
        if (boatObj.ghatId && typeof boatObj.ghatId === 'object' && !boatObj.ghatId.ghatName) {
            boatObj.ghatId.ghatName = boatObj.ghatName;
        }

        res.status(200).json({ boat: boatObj });
    } catch (error) {
        console.error('Error fetching driver boat:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

