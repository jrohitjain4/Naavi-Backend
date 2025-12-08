const mongoose = require('mongoose');

const ghatSchema = new mongoose.Schema({
    ghatId: {
        type: String,
        required: true,
        unique: true,
    },
    ghatName: {
        type: String,
        required: true,
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
        required: true,
    },
    zoneName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    },
    boardingPoints: {
        type: [String],
        default: [],
    },
}, { timestamps: true });

// Index for faster queries
ghatSchema.index({ zoneId: 1 });
ghatSchema.index({ ghatName: 1 });

module.exports = mongoose.model('Ghat', ghatSchema);

