const Coupon = require('../models/Coupon');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Coupon ID
const generateCouponId = async () => {
    try {
        // Find the last coupon to get the highest number
        const lastCoupon = await Coupon.findOne({ couponId: { $exists: true, $ne: null } })
            .sort({ couponId: -1 });
        
        if (!lastCoupon || !lastCoupon.couponId) {
            // First coupon
            return 'COUP-001';
        }
        
        // Extract number from last coupon ID (e.g., "COUP-001" -> 1)
        const lastNumber = parseInt(lastCoupon.couponId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        
        // Format as COUP-XXX (3 digits with leading zeros)
        return `COUP-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating coupon ID:', error);
        // Fallback: use timestamp-based ID
        return `COUP-${Date.now().toString().slice(-3)}`;
    }
};

// Get all coupons
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get coupon statistics
exports.getCouponStats = async (req, res) => {
    try {
        const active = await Coupon.countDocuments({ status: 'Active' });
        const expired = await Coupon.countDocuments({ status: 'Expired' });
        const inactive = await Coupon.countDocuments({ status: 'Inactive' });
        const total = await Coupon.countDocuments();
        
        // Total uses across all coupons
        const allCoupons = await Coupon.find();
        const totalUses = allCoupons.reduce((sum, coupon) => sum + (coupon.currentUses || 0), 0);
        
        res.status(200).json({
            active,
            expired,
            inactive,
            total,
            totalUses,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single coupon by ID
exports.getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.status(200).json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new coupon
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, discount, minOrder, maxUses, expiryDate, description } = req.body;
        
        // Validate required fields
        if (!code || !discount || !expiryDate) {
            return res.status(400).json({ message: 'Code, discount, and expiry date are required' });
        }
        
        // Check if code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        
        // Check if expiry date is in the past
        const expiry = new Date(expiryDate);
        if (expiry < new Date()) {
            return res.status(400).json({ message: 'Expiry date cannot be in the past' });
        }
        
        // Generate coupon ID automatically
        const couponId = await generateCouponId();
        
        // Determine status based on expiry date
        let status = 'Active';
        if (expiry < new Date()) {
            status = 'Expired';
        }
        
        const newCoupon = new Coupon({
            couponId,
            code: code.toUpperCase(),
            discountType: discountType || 'percentage',
            discount,
            minOrder: minOrder || 0,
            maxUses: maxUses || null,
            currentUses: 0,
            status,
            expiryDate: expiry,
            description: description || '',
        });
        
        await newCoupon.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Created Coupon',
            module: 'Coupons & Promotions',
            details: `${newCoupon.couponId} - ${newCoupon.code}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newCoupon._id.toString(),
            entityType: 'Coupon',
        });
        
        res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update coupon
exports.updateCoupon = async (req, res) => {
    try {
        const { code, discountType, discount, minOrder, maxUses, expiryDate, description, status } = req.body;
        
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        // Check if code is being changed and if it already exists
        if (code && code.toUpperCase() !== coupon.code) {
            const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (existingCoupon) {
                return res.status(400).json({ message: 'Coupon code already exists' });
            }
            coupon.code = code.toUpperCase();
        }
        
        // Update fields
        if (discountType !== undefined) coupon.discountType = discountType;
        if (discount !== undefined) coupon.discount = discount;
        if (minOrder !== undefined) coupon.minOrder = minOrder;
        if (maxUses !== undefined) coupon.maxUses = maxUses;
        if (description !== undefined) coupon.description = description;
        if (status !== undefined) coupon.status = status;
        
        // Update expiry date
        if (expiryDate) {
            const expiry = new Date(expiryDate);
            if (expiry < new Date() && coupon.status === 'Active') {
                coupon.status = 'Expired';
            }
            coupon.expiryDate = expiry;
        }
        
        // Auto-update status based on expiry
        if (new Date(coupon.expiryDate) < new Date() && coupon.status === 'Active') {
            coupon.status = 'Expired';
        }
        
        await coupon.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Coupon',
            module: 'Coupons & Promotions',
            details: `${coupon.couponId} - ${coupon.code}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: coupon._id.toString(),
            entityType: 'Coupon',
        });
        
        res.status(200).json({ message: 'Coupon updated successfully', coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Coupon',
            module: 'Coupons & Promotions',
            details: `${coupon.couponId} - ${coupon.code}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: coupon._id.toString(),
            entityType: 'Coupon',
        });
        
        await Coupon.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Validate coupon code
exports.validateCoupon = async (req, res) => {
    try {
        const { code, totalAmount } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }

        // Find coupon by code
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        // Check if coupon is active
        if (coupon.status !== 'Active') {
            return res.status(400).json({ message: 'Coupon is not active' });
        }

        // Check if coupon is expired
        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // Check if max uses reached
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Check minimum order amount
        if (totalAmount < coupon.minOrder) {
            return res.status(400).json({ 
                message: `Minimum order amount of ₹${coupon.minOrder} required for this coupon` 
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (totalAmount * coupon.discount) / 100;
        } else {
            discountAmount = coupon.discount;
        }

        // Ensure discount doesn't exceed total amount
        if (discountAmount > totalAmount) {
            discountAmount = totalAmount;
        }

        const finalPrice = totalAmount - discountAmount;

        res.status(200).json({
            valid: true,
            coupon: {
                _id: coupon._id,
                couponId: coupon.couponId,
                code: coupon.code,
                discountType: coupon.discountType,
                discount: coupon.discount,
                description: coupon.description,
            },
            discountAmount,
            finalPrice,
            originalPrice: totalAmount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get active coupons
exports.getActiveCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({
            status: 'Active',
            expiryDate: { $gte: new Date() },
        }).sort({ createdAt: -1 });

        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

