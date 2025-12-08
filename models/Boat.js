const mongoose = require('mongoose');

const boatSchema = new mongoose.Schema({
    boatId: {
        type: String,
        required: true,
        unique: true,
    },
    // Reference to admin-created boat type
    boatTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BoatType',
        required: true,
    },
    // Boat type name and capacity from BoatType (for quick access)
    boatType: {
        type: String,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
    },
    // Driver boat registration fields
    boatNumber: {
        type: String, // Government Authority number
        required: true,
        unique: true,
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    ghatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ghat',
        default: null,
    },
    ghatName: {
        type: String,
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
    associatedDriverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null,
    },
    boatRegistrationPaper: {
        type: String, // File path/URL
        default: null,
    },
    status: {
        type: String,
        enum: ['Available', 'In Service', 'Maintenance', 'Pending'],
        default: 'Pending', // Pending until admin approves
    },
}, { timestamps: true });

module.exports = mongoose.model('Boat', boatSchema);
