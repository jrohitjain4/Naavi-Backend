const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
    driverId: {
        type: String,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    mobileNo: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    aadharCard: {
        type: String, // File path/URL
        default: null,
    },
    panCard: {
        type: String, // File path/URL
        default: null,
    },
    boatDrivingLicense: {
        type: String, // File path/URL
        default: null,
    },
    associatedBoatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boat',
        default: null,
    },
    boatId: {
        type: String, // Boat ID string (e.g., "BOAT-ZONE001-001")
        default: null,
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
        required: true,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    isActive: {
        type: Boolean,
        default: false, // Only true when approved
    },
    availability: {
        type: String,
        enum: ['Available', 'OnDuty'],
        default: 'Available',
    },
    // OTP fields for login
    otp: {
        type: String,
        default: null,
    },
    otpExpiry: {
        type: Date,
        default: null,
    },
    // Legacy fields (for backward compatibility)
    phone: {
        type: String,
    },
    email: {
        type: String,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalTrips: {
        type: Number,
        default: 0,
        min: 0,
    },
    zone: {
        type: String,
    },
    earningsMonth: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });

// Hash password before saving
driverSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
driverSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
