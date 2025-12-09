const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    zoneId: {
        type: String,
        required: true,
        unique: true,
    },
    zoneName: {
        type: String,
        required: true,
    },
    ghats: {
        type: [{
            ghatId: {
                type: String,
                required: true,
            },
        }],
        default: [],
    },
    totalGhats: {
        type: Number,
        default: 0,
    },
    boats: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    status: {
        type: String,
        required: true,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    boardingPoints: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

// Pre-save middleware to update totalGhats from ghats array
zoneSchema.pre('save', function(next) {
    if (this.ghats && Array.isArray(this.ghats)) {
        this.totalGhats = this.ghats.length;
    }
    next();
});

module.exports = mongoose.model('Zone', zoneSchema);

