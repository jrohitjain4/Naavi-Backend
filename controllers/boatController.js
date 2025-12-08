const BoatType = require('../models/BoatType');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate next Boat Type ID
const generateBoatId = async (retryCount = 0) => {
    try {
        // Get all boat types and find the highest boat ID number
        const allBoatTypes = await BoatType.find({}, { boatId: 1 }).sort({ createdAt: -1 });
        
        let maxNumber = 0;
        
        if (allBoatTypes.length > 0) {
            // Extract numbers from all boat type IDs and find the maximum
            allBoatTypes.forEach(boatType => {
                if (boatType.boatId) {
                    const match = boatType.boatId.match(/BOAT-(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num > maxNumber) {
                            maxNumber = num;
                        }
                    }
                }
            });
        }
        
        const nextNumber = maxNumber + 1;
        const newBoatId = `BOAT-${String(nextNumber).padStart(3, '0')}`;
        
        // Check if this ID already exists (safety check)
        const exists = await BoatType.findOne({ boatId: newBoatId });
        if (exists && retryCount < 5) {
            // If exists, try next number
            return generateBoatId(retryCount + 1);
        }
        
        return newBoatId;
    } catch (error) {
        console.error('Error generating boat ID:', error);
        // Fallback: use timestamp-based ID with random component
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `BOAT-${timestamp}${random}`.slice(0, 11); // Ensure it's not too long
    }
};

// Get all boat types
exports.getAllBoats = async (req, res) => {
    try {
        const boatTypes = await BoatType.find().sort({ boatId: 1 });
        res.status(200).json(boatTypes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get boat type statistics
exports.getBoatStats = async (req, res) => {
    try {
        const total = await BoatType.countDocuments();
        const totalBoats = await BoatType.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$numberOfBoats' }
                }
            }
        ]);
        
        res.status(200).json({
            total,
            totalBoats: totalBoats[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single boat type by ID
exports.getBoatById = async (req, res) => {
    try {
        const boatType = await BoatType.findById(req.params.id);
        if (!boatType) {
            return res.status(404).json({ message: 'Boat type not found' });
        }
        res.status(200).json(boatType);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new boat
exports.createBoat = async (req, res) => {
    try {
        // Only get boatType and capacity from request - everything else is auto-generated
        const { boatType, capacity } = req.body;
        
        // Validation - only boatType and capacity are required
        if (!boatType || !capacity) {
            return res.status(400).json({ message: 'boatType and capacity are required' });
        }

        if (isNaN(capacity) || capacity < 1) {
            return res.status(400).json({ message: 'Capacity must be a positive number' });
        }
        
        // Generate boat type ID automatically
        let boatId = await generateBoatId();
        
        // Check if boatId already exists, if yes generate a new one
        let existingBoatType = await BoatType.findOne({ boatId });
        let retryCount = 0;
        while (existingBoatType && retryCount < 10) {
            boatId = await generateBoatId(retryCount + 1);
            existingBoatType = await BoatType.findOne({ boatId });
            retryCount++;
        }
        
        // Create boat type with only required fields - numberOfBoats defaults to 0
        const newBoatType = new BoatType({
            boatId,
            boatType: boatType.trim(), // Remove extra spaces
            capacity: Number(capacity),
            // numberOfBoats will default to 0 from schema
        });
        
        await newBoatType.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Created Boat Type',
            module: 'Boat Types',
            details: `${newBoatType.boatId} - ${newBoatType.boatType}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newBoatType._id.toString(),
            entityType: 'BoatType',
        });
        
        res.status(201).json({ message: 'Boat type created successfully', boat: newBoatType });
    } catch (error) {
        console.error('Create boat error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            // If it's a boatId duplicate, try generating a new one
            if (error.keyPattern && error.keyPattern.boatId) {
                try {
                    const { boatType, capacity } = req.body;
                    const newBoatId = await generateBoatId(1);
                    const retryBoatType = new BoatType({
                        boatId: newBoatId,
                        boatType: boatType.trim(),
                        capacity: Number(capacity),
                    });
                    await retryBoatType.save();
                    
                    await createAuditLog({
                        user: req.user?.email || req.user?.name || 'System',
                        email: req.user?.email,
                        userId: req.user?._id?.toString() || '',
                        action: 'Created Boat Type',
                        module: 'Boat Types',
                        details: `${retryBoatType.boatId} - ${retryBoatType.boatType}`,
                        ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
                        entityId: retryBoatType._id.toString(),
                        entityType: 'BoatType',
                    });
                    
                    return res.status(201).json({ message: 'Boat type created successfully', boat: retryBoatType });
                } catch (retryError) {
                    return res.status(500).json({ 
                        message: 'Error creating boat type. Please run the fix script to remove old indexes.', 
                        error: retryError.message 
                    });
                }
            } else {
                // Other duplicate key error (like old registration index)
                return res.status(500).json({ 
                    message: 'Database index error. Please run: node scripts/fixBoatIndexes.js to fix this issue.',
                    error: 'Old database indexes need to be removed'
                });
            }
        }
        
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update boat type
exports.updateBoat = async (req, res) => {
    try {
        const { boatType, capacity, numberOfBoats } = req.body;
        
        const boatTypeDoc = await BoatType.findById(req.params.id);
        if (!boatTypeDoc) {
            return res.status(404).json({ message: 'Boat type not found' });
        }
        
        // Validation
        if (capacity !== undefined && capacity < 1) {
            return res.status(400).json({ message: 'Capacity must be at least 1' });
        }

        if (numberOfBoats !== undefined && numberOfBoats < 0) {
            return res.status(400).json({ message: 'Number of boats cannot be negative' });
        }
        
        // Update fields (boatId cannot be changed)
        if (boatType !== undefined) boatTypeDoc.boatType = boatType;
        if (capacity !== undefined) boatTypeDoc.capacity = capacity;
        if (numberOfBoats !== undefined) boatTypeDoc.numberOfBoats = numberOfBoats;
        
        await boatTypeDoc.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Boat Type',
            module: 'Boat Types',
            details: `${boatTypeDoc.boatId} - ${boatTypeDoc.boatType}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: boatTypeDoc._id.toString(),
            entityType: 'BoatType',
        });
        
        res.status(200).json({ message: 'Boat type updated successfully', boat: boatTypeDoc });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Boat ID already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete boat type
exports.deleteBoat = async (req, res) => {
    try {
        const boatTypeDoc = await BoatType.findById(req.params.id);
        if (!boatTypeDoc) {
            return res.status(404).json({ message: 'Boat type not found' });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Boat Type',
            module: 'Boat Types',
            details: `${boatTypeDoc.boatId} - ${boatTypeDoc.boatType}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: boatTypeDoc._id.toString(),
            entityType: 'BoatType',
        });
        
        await BoatType.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Boat type deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
