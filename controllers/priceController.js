const Price = require('../models/Price');
const BoatType = require('../models/BoatType');
const Zone = require('../models/Zone');
const { createAuditLog } = require('../middleware/auditLog');

// Get all prices
exports.getAllPrices = async (req, res) => {
    try {
        const { boatTypeId, zoneId, tripType } = req.query;
        
        let query = {};
        if (boatTypeId) query.boatTypeId = boatTypeId;
        if (zoneId) query.zoneId = zoneId;
        if (tripType) query.tripType = tripType;
        
        const prices = await Price.find(query)
            .populate('boatTypeId', 'boatId boatType capacity')
            .populate('zoneId', 'zoneId zoneName')
            .sort({ createdAt: -1 });
        
        res.status(200).json(prices);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get price by ID
exports.getPriceById = async (req, res) => {
    try {
        const price = await Price.findById(req.params.id)
            .populate('boatTypeId', 'boatId boatType capacity')
            .populate('zoneId', 'zoneId zoneName');
        
        if (!price) {
            return res.status(404).json({ message: 'Price not found' });
        }
        
        res.status(200).json(price);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get price for specific boat, zone, and trip type (for frontend)
exports.getPrice = async (req, res) => {
    try {
        const { boatTypeId, zoneId, tripType } = req.query;
        
        if (!boatTypeId || !tripType) {
            return res.status(400).json({ message: 'boatTypeId and tripType are required' });
        }
        
        // Priority 1: Zone-specific price
        let price = await Price.findOne({
            boatTypeId,
            zoneId: zoneId || null,
            tripType,
            isActive: true,
        });
        
        // Priority 2: Zone-agnostic price (if zoneId was provided but no zone-specific price found)
        if (!price && zoneId) {
            price = await Price.findOne({
                boatTypeId,
                zoneId: null,
                tripType,
                isActive: true,
            });
        }
        
        // Priority 3: If still no price, get default from boat type or return 1000
        if (!price) {
            const boatType = await BoatType.findById(boatTypeId);
            return res.status(200).json({
                price: 1000, // Default price
                isDefault: true,
                boatType: boatType?.boatType || 'Unknown',
            });
        }
        
        res.status(200).json({
            price: price.price,
            isDefault: false,
            boatType: price.boatTypeId?.boatType || 'Unknown',
            zone: price.zoneId ? price.zoneId.zoneName : 'All Zones',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new price
exports.createPrice = async (req, res) => {
    try {
        const { boatTypeId, zoneId, tripType, price, isActive } = req.body;
        
        // Validation
        if (!boatTypeId || !tripType || price === undefined) {
            return res.status(400).json({ message: 'boatTypeId, tripType, and price are required' });
        }
        
        if (price < 0) {
            return res.status(400).json({ message: 'Price must be a positive number' });
        }
        
        // Validate boat type exists
        const boatType = await BoatType.findById(boatTypeId);
        if (!boatType) {
            return res.status(404).json({ message: 'Boat type not found' });
        }
        
        // Validate zone exists (if provided)
        if (zoneId) {
            const zone = await Zone.findById(zoneId);
            if (!zone) {
                return res.status(404).json({ message: 'Zone not found' });
            }
        }
        
        const newPrice = new Price({
            boatTypeId,
            zoneId: zoneId || null,
            tripType,
            price,
            isActive: isActive !== undefined ? isActive : true,
        });
        
        await newPrice.save();
        
        // Populate for response
        await newPrice.populate('boatTypeId', 'boatId boatType capacity');
        await newPrice.populate('zoneId', 'zoneId zoneName');
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Created Price',
            module: 'Pricing',
            details: `${boatType.boatType} - ${tripType} - ₹${price}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newPrice._id.toString(),
            entityType: 'Price',
        });
        
        res.status(201).json({ message: 'Price created successfully', price: newPrice });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Price already exists for this boat type, zone, and trip type combination' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update price
exports.updatePrice = async (req, res) => {
    try {
        const { price, isActive } = req.body;
        
        const priceDoc = await Price.findById(req.params.id)
            .populate('boatTypeId', 'boatId boatType capacity')
            .populate('zoneId', 'zoneId zoneName');
        
        if (!priceDoc) {
            return res.status(404).json({ message: 'Price not found' });
        }
        
        // Validation
        if (price !== undefined) {
            if (price < 0) {
                return res.status(400).json({ message: 'Price must be a positive number' });
            }
            priceDoc.price = price;
        }
        
        if (isActive !== undefined) {
            priceDoc.isActive = isActive;
        }
        
        await priceDoc.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Price',
            module: 'Pricing',
            details: `${priceDoc.boatTypeId.boatType} - ${priceDoc.tripType} - ₹${priceDoc.price}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: priceDoc._id.toString(),
            entityType: 'Price',
        });
        
        res.status(200).json({ message: 'Price updated successfully', price: priceDoc });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete price
exports.deletePrice = async (req, res) => {
    try {
        const priceDoc = await Price.findById(req.params.id)
            .populate('boatTypeId', 'boatId boatType capacity')
            .populate('zoneId', 'zoneId zoneName');
        
        if (!priceDoc) {
            return res.status(404).json({ message: 'Price not found' });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Price',
            module: 'Pricing',
            details: `${priceDoc.boatTypeId.boatType} - ${priceDoc.tripType} - ₹${priceDoc.price}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: priceDoc._id.toString(),
            entityType: 'Price',
        });
        
        await Price.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Price deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

