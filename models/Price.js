const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    boatTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BoatType',
        required: true,
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
        default: null, // null means applies to all zones
    },
    tripType: {
        type: String,
        required: true,
        enum: ['Full Trip', 'Half Trip', 'Cross Trip'],
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Compound index to ensure unique combination
// One price per boatType + zone + tripType combination
priceSchema.index({ boatTypeId: 1, zoneId: 1, tripType: 1 }, { unique: true });

module.exports = mongoose.model('Price', priceSchema);

