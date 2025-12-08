// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    customerId: {
        type: String,
        unique: true,
        sparse: true, // Allow null values but enforce uniqueness when present
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);