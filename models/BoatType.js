const mongoose = require('mongoose');

const boatTypeSchema = new mongoose.Schema({
    boatId: {
        type: String,
        required: true,
        unique: true,
    },
    boatType: {
        type: String,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
    },
    numberOfBoats: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('BoatType', boatTypeSchema);

