const Ghat = require('../models/Ghat');
const Zone = require('../models/Zone');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Ghat ID
const generateGhatId = async () => {
    try {
        const lastGhat = await Ghat.findOne().sort({ ghatId: -1 });
        
        if (!lastGhat || !lastGhat.ghatId) {
            return 'GHAT-001';
        }
        
        const lastNumber = parseInt(lastGhat.ghatId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        
        return `GHAT-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating ghat ID:', error);
        return `GHAT-${Date.now().toString().slice(-3)}`;
    }
};

// Get all ghats
exports.getAllGhats = async (req, res) => {
    try {
        const ghats = await Ghat.find()
            .populate('zoneId', 'zoneId zoneName')
            .sort({ zoneId: 1, ghatName: 1 });
        res.status(200).json(ghats);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get ghats by zone ID
exports.getGhatsByZoneId = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const ghats = await Ghat.find({ zoneId, status: 'Active' })
            .populate('zoneId', 'zoneId zoneName')
            .sort({ ghatName: 1 });
        res.status(200).json(ghats);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single ghat by ID
exports.getGhatById = async (req, res) => {
    try {
        const ghat = await Ghat.findById(req.params.id)
            .populate('zoneId', 'zoneId zoneName');
        
        if (!ghat) {
            return res.status(404).json({ message: 'Ghat not found' });
        }
        
        res.status(200).json(ghat);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new ghat
exports.createGhat = async (req, res) => {
    try {
        const { ghatName, zoneId, status, boardingPoints } = req.body;
        
        if (!ghatName || !zoneId) {
            return res.status(400).json({ message: 'Ghat name and zone ID are required' });
        }
        
        // Verify zone exists
        const zone = await Zone.findById(zoneId);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        
        // Generate ghat ID automatically
        const ghatId = await generateGhatId();
        
        // Convert boardingPoints to array if provided
        const boardingPointsArray = boardingPoints && Array.isArray(boardingPoints)
            ? boardingPoints
            : (boardingPoints && typeof boardingPoints === 'string' 
                ? boardingPoints.split(',').map(bp => bp.trim()).filter(bp => bp.length > 0)
                : []);
        
        const newGhat = new Ghat({
            ghatId,
            ghatName,
            zoneId,
            zoneName: zone.zoneName,
            status: status || 'Active',
            boardingPoints: boardingPointsArray,
        });
        
        await newGhat.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Created Ghat',
            module: 'Ghats',
            details: `${newGhat.ghatId} - ${newGhat.ghatName} in ${zone.zoneName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newGhat._id.toString(),
            entityType: 'Ghat',
        });
        
        res.status(201).json({ message: 'Ghat created successfully', ghat: newGhat });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ghat ID already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update ghat
exports.updateGhat = async (req, res) => {
    try {
        const { ghatName, zoneId, status, boardingPoints } = req.body;
        
        const ghat = await Ghat.findById(req.params.id);
        if (!ghat) {
            return res.status(404).json({ message: 'Ghat not found' });
        }
        
        // Update fields
        if (ghatName) ghat.ghatName = ghatName;
        if (status) ghat.status = status;
        
        // Update boardingPoints if provided
        if (boardingPoints !== undefined) {
            const boardingPointsArray = Array.isArray(boardingPoints)
                ? boardingPoints
                : (typeof boardingPoints === 'string' 
                    ? boardingPoints.split(',').map(bp => bp.trim()).filter(bp => bp.length > 0)
                    : []);
            ghat.boardingPoints = boardingPointsArray;
        }
        
        // Update zone if changed
        if (zoneId && zoneId !== ghat.zoneId.toString()) {
            const zone = await Zone.findById(zoneId);
            if (!zone) {
                return res.status(404).json({ message: 'Zone not found' });
            }
            ghat.zoneId = zoneId;
            ghat.zoneName = zone.zoneName;
        }
        
        await ghat.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Ghat',
            module: 'Ghats',
            details: `${ghat.ghatId} - ${ghat.ghatName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: ghat._id.toString(),
            entityType: 'Ghat',
        });
        
        res.status(200).json({ message: 'Ghat updated successfully', ghat });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete ghat
exports.deleteGhat = async (req, res) => {
    try {
        const ghat = await Ghat.findById(req.params.id);
        if (!ghat) {
            return res.status(404).json({ message: 'Ghat not found' });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Ghat',
            module: 'Ghats',
            details: `${ghat.ghatId} - ${ghat.ghatName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: ghat._id.toString(),
            entityType: 'Ghat',
        });
        
        await Ghat.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Ghat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Bulk create ghats (for initial population)
exports.bulkCreateGhats = async (req, res) => {
    try {
        const { ghats } = req.body; // Array of { ghatName, zoneId }
        
        if (!Array.isArray(ghats) || ghats.length === 0) {
            return res.status(400).json({ message: 'Ghats array is required' });
        }
        
        const createdGhats = [];
        
        for (const ghatData of ghats) {
            const { ghatName, zoneId } = ghatData;
            
            if (!ghatName || !zoneId) {
                continue; // Skip invalid entries
            }
            
            // Verify zone exists
            const zone = await Zone.findById(zoneId);
            if (!zone) {
                continue; // Skip if zone doesn't exist
            }
            
            // Check if ghat already exists
            const existingGhat = await Ghat.findOne({ 
                ghatName: ghatName.trim(),
                zoneId 
            });
            
            if (existingGhat) {
                continue; // Skip if already exists
            }
            
            const ghatId = await generateGhatId();
            
            const newGhat = new Ghat({
                ghatId,
                ghatName: ghatName.trim(),
                zoneId,
                zoneName: zone.zoneName,
                status: 'Active',
            });
            
            await newGhat.save();
            createdGhats.push(newGhat);
        }
        
        res.status(201).json({ 
            message: `Created ${createdGhats.length} ghats successfully`, 
            ghats: createdGhats 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

