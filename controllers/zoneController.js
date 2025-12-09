const Zone = require('../models/Zone');
const Boat = require('../models/Boat');
const Ghat = require('../models/Ghat');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Ghat ID (imported from ghatController logic)
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

// Helper function to sync ghats from Zone to Ghat model
const syncGhatsToModel = async (zone, ghatsArray) => {
    if (!ghatsArray || !Array.isArray(ghatsArray)) {
        return [];
    }

    const ghatIds = [];
    
    // Get existing ghats for this zone
    const existingGhats = await Ghat.find({ zoneId: zone._id });
    const existingGhatNames = new Set(existingGhats.map(g => g.ghatName.toLowerCase()));
    
    // Process each ghat name
    for (const ghatItem of ghatsArray) {
        const ghatName = typeof ghatItem === 'string' ? ghatItem : (ghatItem.name || ghatItem.ghatName);
        
        if (!ghatName || !ghatName.trim()) {
            continue;
        }
        
        const trimmedName = ghatName.trim();
        const ghatNameLower = trimmedName.toLowerCase();
        
        // Check if ghat already exists
        let existingGhat = existingGhats.find(g => g.ghatName.toLowerCase() === ghatNameLower);
        
        if (!existingGhat) {
            // Create new ghat
            const ghatId = await generateGhatId();
            const newGhat = new Ghat({
                ghatId,
                ghatName: trimmedName,
                zoneId: zone._id,
                zoneName: zone.zoneName,
                status: 'Active',
                boardingPoints: zone.boardingPoints || [],
            });
            
            await newGhat.save();
            ghatIds.push(ghatId);
            
            // Create audit log for ghat creation
            await createAuditLog({
                user: 'System',
                action: 'Created Ghat',
                module: 'Ghats',
                details: `${ghatId} - ${trimmedName} in ${zone.zoneName} (via Zone)`,
                entityId: newGhat._id.toString(),
                entityType: 'Ghat',
            });
        } else {
            // Use existing ghat
            ghatIds.push(existingGhat.ghatId);
        }
    }
    
    // Delete ghats that are no longer in the zone's ghats array
    const currentGhatNames = new Set(ghatsArray.map(g => {
        const name = typeof g === 'string' ? g : (g.name || g.ghatName);
        return name ? name.trim().toLowerCase() : '';
    }).filter(n => n));
    
    for (const existingGhat of existingGhats) {
        if (!currentGhatNames.has(existingGhat.ghatName.toLowerCase())) {
            // Ghat was removed from zone, delete it
            await Ghat.findByIdAndDelete(existingGhat._id);
            
            // Create audit log for ghat deletion
            await createAuditLog({
                user: 'System',
                action: 'Deleted Ghat',
                module: 'Ghats',
                details: `${existingGhat.ghatId} - ${existingGhat.ghatName} (removed from zone)`,
                entityId: existingGhat._id.toString(),
                entityType: 'Ghat',
            });
        }
    }
    
    return ghatIds;
};

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
        // Use lean() to get plain objects and avoid Mongoose validation issues
        const zones = await Zone.find().sort({ zoneId: 1 }).lean();
        
        // Prepare response with populated ghat names
        const zonesWithGhats = await Promise.all(zones.map(async (zone) => {
            // Update boats count
            const boatsCount = await Boat.countDocuments({ zoneId: zone._id });
            
            // Fetch ghats from Ghat collection for this zone
            const ghats = await Ghat.find({ zoneId: zone._id }).select('ghatId ghatName -_id').lean();
            
            // Build zone object with ghats
            const zoneObj = {
                ...zone,
                boats: boatsCount,
                ghats: ghats.map(ghat => ({ 
                    ghatId: ghat.ghatId,
                    name: ghat.ghatName // Include name for frontend display
                })),
                totalGhats: ghats.length,
            };
            
            return zoneObj;
        }));
        
        res.status(200).json(zonesWithGhats);
    } catch (error) {
        console.error('Error in getAllZones:', error);
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
        // Use lean() to get plain object and avoid Mongoose validation issues
        const zone = await Zone.findById(req.params.id).lean();
        if (!zone) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        
        // Update boats count
        const boatsCount = await Boat.countDocuments({ zoneId: zone._id });
        
        // Fetch ghats from Ghat collection for this zone
        const ghats = await Ghat.find({ zoneId: zone._id }).select('ghatId ghatName -_id').lean();
        
        // Build zone object with ghats
        const zoneObj = {
            ...zone,
            boats: boatsCount,
            ghats: ghats.map(ghat => ({ 
                ghatId: ghat.ghatId,
                name: ghat.ghatName // Include name for frontend display
            })),
            totalGhats: ghats.length,
        };
        
        res.status(200).json(zoneObj);
    } catch (error) {
        console.error('Error in getZoneById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new zone
exports.createZone = async (req, res) => {
    try {
        const { zoneName, ghats, status, boardingPoints } = req.body;
        
        // Generate zone ID automatically
        const zoneId = await generateZoneId();
        
        // Convert boardingPoints to array if provided
        const boardingPointsArray = boardingPoints && Array.isArray(boardingPoints)
            ? boardingPoints
            : (boardingPoints && typeof boardingPoints === 'string' 
                ? boardingPoints.split(',').map(bp => bp.trim()).filter(bp => bp.length > 0)
                : []);
        
        // Create zone first
        const newZone = new Zone({
            zoneId,
            zoneName,
            ghats: [], // Will be populated after ghats are created
            totalGhats: 0,
            boats: 0, // Will be calculated from boats
            status: status || 'Active',
            boardingPoints: boardingPointsArray,
        });
        
        await newZone.save();
        
        // Now sync ghats - create Ghat entries and get ghatIds
        let ghatIds = [];
        if (ghats && Array.isArray(ghats) && ghats.length > 0) {
            ghatIds = await syncGhatsToModel(newZone, ghats);
            
            // Update zone with ghatIds
            newZone.ghats = ghatIds.map(ghatId => ({ ghatId }));
            newZone.totalGhats = ghatIds.length;
            await newZone.save();
        }
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Created Zone',
            module: 'Zones',
            details: `${newZone.zoneId} - ${newZone.zoneName} with ${ghatIds.length} ghat(s)`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newZone._id.toString(),
            entityType: 'Zone',
        });
        
        // Fetch updated zone with populated data
        const updatedZone = await Zone.findById(newZone._id);
        const ghatsData = await Ghat.find({ zoneId: newZone._id }).select('ghatId ghatName -_id');
        
        // Convert to plain object and add ghat names
        const zoneObj = updatedZone.toObject();
        zoneObj.ghats = ghatsData.map(ghat => ({ 
            ghatId: ghat.ghatId,
            name: ghat.ghatName // Include name for frontend display
        }));
        
        res.status(201).json({ message: 'Zone created successfully', zone: zoneObj });
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
        if (zoneName) zone.zoneName = zoneName;
        if (status) zone.status = status;
        
        // Update ghats if provided - sync to Ghat model
        if (ghats !== undefined) {
            const ghatsArray = Array.isArray(ghats) ? ghats : [];
            const ghatIds = await syncGhatsToModel(zone, ghatsArray);
            
            // Update zone with ghatIds
            zone.ghats = ghatIds.map(ghatId => ({ ghatId }));
            zone.totalGhats = ghatIds.length;
        }
        
        // Update boardingPoints if provided
        if (boardingPoints !== undefined) {
            const boardingPointsArray = Array.isArray(boardingPoints)
                ? boardingPoints
                : (typeof boardingPoints === 'string' 
                    ? boardingPoints.split(',').map(bp => bp.trim()).filter(bp => bp.length > 0)
                    : []);
            zone.boardingPoints = boardingPointsArray;
            
            // Also update boarding points in all ghats of this zone
            await Ghat.updateMany(
                { zoneId: zone._id },
                { boardingPoints: boardingPointsArray }
            );
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
        
        // Fetch updated zone with populated ghats
        const ghatsData = await Ghat.find({ zoneId: zone._id }).select('ghatId ghatName -_id');
        
        // Convert to plain object and add ghat names
        const zoneObj = zone.toObject();
        zoneObj.ghats = ghatsData.map(ghat => ({ 
            ghatId: ghat.ghatId,
            name: ghat.ghatName // Include name for frontend display
        }));
        
        res.status(200).json({ message: 'Zone updated successfully', zone: zoneObj });
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
        
        // Delete all ghats associated with this zone
        const ghatsCount = await Ghat.countDocuments({ zoneId: zone._id });
        if (ghatsCount > 0) {
            await Ghat.deleteMany({ zoneId: zone._id });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Zone',
            module: 'Zones',
            details: `${zone.zoneId} - ${zone.zoneName} (and ${ghatsCount} ghat(s))`,
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

