const Zone = require('../models/Zone');
const Boat = require('../models/Boat');
const Ghat = require('../models/Ghat');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Zone ID
const generateZoneId = async () => {
    try {
        // Find the last zone to get the highest number
        const lastZone = await Zone.findOne({ zoneId: { $exists: true, $ne: null } })
            .sort({ zoneId: -1 });
        
        if (!lastZone || !lastZone.zoneId) {
            // First zone
            return 'ZONE-001';
        }
        
        // Extract number from last zone ID (e.g., "ZONE-001" -> 1)
        const lastNumber = parseInt(lastZone.zoneId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        
        // Format as ZONE-XXX (3 digits with leading zeros)
        return `ZONE-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating zone ID:', error);
        // Fallback: use timestamp-based ID
        return `ZONE-${Date.now().toString().slice(-3)}`;
    }
};

// Get all zones
exports.getAllZones = async (req, res) => {
    try {
        const zones = await Zone.find().sort({ zoneId: 1 });
        
        // Update boats count and populate ghats for each zone
        for (const zone of zones) {
            const boatsCount = await Boat.countDocuments({ zoneId: zone._id });
            zone.boats = boatsCount;
            
            // Fetch ghats from Ghat collection for this zone
            const ghats = await Ghat.find({ zoneId: zone._id }).select('ghatName -_id');
            
            // Update zone's ghats array with ghat names
            zone.ghats = ghats.map(ghat => ({ name: ghat.ghatName }));
            zone.totalGhats = ghats.length;
            
            await zone.save();
        }
        
        res.status(200).json(zones);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get zone statistics
exports.getZoneStats = async (req, res) => {
    try {
        const total = await Zone.countDocuments();
        const active = await Zone.countDocuments({ status: 'Active' });
        const inactive = await Zone.countDocuments({ status: 'Inactive' });
        
        // Calculate total ghats and boats
        const zones = await Zone.find();
        const totalGhats = zones.reduce((sum, zone) => {
            if (zone.ghats && Array.isArray(zone.ghats)) {
                return sum + zone.ghats.length;
            }
            return sum + (zone.totalGhats || 0);
        }, 0);
        
        // Count actual driver boats (not boat types)
        let totalBoats = 0;
        try {
            totalBoats = await Boat.countDocuments();
        } catch (boatError) {
            console.error('Error counting boats:', boatError);
            // If boat count fails, set to 0
            totalBoats = 0;
        }
        
        res.status(200).json({
            total,
            active,
            inactive,
            totalGhats,
            totalBoats,
        });
    } catch (error) {
        console.error('Error in getZoneStats:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get single zone by ID
exports.getZoneById = async (req, res) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        
        // Update boats count
        const boatsCount = await Boat.countDocuments({ zoneId: zone._id });
        zone.boats = boatsCount;
        
        // Fetch ghats from Ghat collection for this zone
        const ghats = await Ghat.find({ zoneId: zone._id }).select('ghatName -_id');
        
        // Update zone's ghats array with ghat names
        zone.ghats = ghats.map(ghat => ({ name: ghat.ghatName }));
        zone.totalGhats = ghats.length;
        
        await zone.save();
        
        res.status(200).json(zone);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new zone
exports.createZone = async (req, res) => {
    try {
        const { zoneName, ghats, status, boardingPoints } = req.body;
        
        // Generate zone ID automatically
        const zoneId = await generateZoneId();
        
        // Convert ghats array if provided
        const ghatsArray = ghats && Array.isArray(ghats) 
            ? ghats.map(ghat => typeof ghat === 'string' ? { name: ghat } : ghat)
            : [];
        
        // Convert boardingPoints to array if provided
        const boardingPointsArray = boardingPoints && Array.isArray(boardingPoints)
            ? boardingPoints
            : (boardingPoints && typeof boardingPoints === 'string' 
                ? boardingPoints.split(',').map(bp => bp.trim()).filter(bp => bp.length > 0)
                : []);
        
        const newZone = new Zone({
            zoneId,
            zoneName,
            ghats: ghatsArray,
            totalGhats: ghatsArray.length,
            boats: 0, // Will be calculated from boats
            status: status || 'Active',
            boardingPoints: boardingPointsArray,
        });
        
        await newZone.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Created Zone',
            module: 'Zones',
            details: `${newZone.zoneId} - ${newZone.zoneName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newZone._id.toString(),
            entityType: 'Zone',
        });
        
        res.status(201).json({ message: 'Zone created successfully', zone: newZone });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Zone ID already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update zone
exports.updateZone = async (req, res) => {
    try {
        const { zoneName, ghats, status, boardingPoints } = req.body;
        
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        
        // Update fields (zoneId cannot be changed)
        zone.zoneName = zoneName || zone.zoneName;
        zone.status = status || zone.status;
        
        // Update ghats if provided
        if (ghats !== undefined) {
            const ghatsArray = Array.isArray(ghats) 
                ? ghats.map(ghat => typeof ghat === 'string' ? { name: ghat } : ghat)
                : [];
            zone.ghats = ghatsArray;
            zone.totalGhats = ghatsArray.length;
        }
        
        // Update boardingPoints if provided
        if (boardingPoints !== undefined) {
            const boardingPointsArray = Array.isArray(boardingPoints)
                ? boardingPoints
                : (typeof boardingPoints === 'string' 
                    ? boardingPoints.split(',').map(bp => bp.trim()).filter(bp => bp.length > 0)
                    : []);
            zone.boardingPoints = boardingPointsArray;
        }
        
        // Update boats count
        const boatsCount = await Boat.countDocuments({ zoneId: zone._id });
        zone.boats = boatsCount;
        
        await zone.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Zone',
            module: 'Zones',
            details: `${zone.zoneId} - ${zone.zoneName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: zone._id.toString(),
            entityType: 'Zone',
        });
        
        res.status(200).json({ message: 'Zone updated successfully', zone });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Zone ID already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete zone
exports.deleteZone = async (req, res) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        
        // Check if zone has boats assigned
        const boatsCount = await Boat.countDocuments({ zoneId: zone._id });
        if (boatsCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete zone. ${boatsCount} boat(s) are assigned to this zone.` 
            });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Zone',
            module: 'Zones',
            details: `${zone.zoneId} - ${zone.zoneName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: zone._id.toString(),
            entityType: 'Zone',
        });
        
        await Zone.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Zone deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

