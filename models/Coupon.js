const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponId: {
        type: String,
        unique: true,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
        default: 'percentage',
    },
    discount: {
        type: Number,
        required: true,
    },
    minOrder: {
        type: Number,
        required: true,
        default: 0,
    },
    maxUses: {
        type: Number,
        default: null, // null means unlimited
    },
    currentUses: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Inactive'],
        default: 'Active',
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
}, { timestamps: true });

// Index for faster queries
// Note: code already has an index from unique: true above
couponSchema.index({ status: 1 });
couponSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Coupon', couponSchema);

