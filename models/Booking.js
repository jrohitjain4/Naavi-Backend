const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    boatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boat',
        required: true,
    },

    boatName: {
        type: String,
        required: true,
    },
    boatType: {
        type: String,
        required: true,
    },
    seats: {
        type: Number,
        required: true,
        min: 1,
    },
    tripType: {
        type: String,
        required: true,
        enum: ['Full Trip', 'Half Trip', 'Cross Trip'],
    },
    pickupPoint: {
        type: String,
        required: true,
    },
    zone: {
        type: String,
        required: true,
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
        default: null,
    },
    bookingDate: {
        type: Date,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    pricePerCandidate: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Accepted', 'Completed'],
        default: 'Pending',
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Pay Now', 'Pay Later'],
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null,
    },
    couponCode: {
        type: String,
        default: null,
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    finalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    gstAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    gstPercentage: {
        type: Number,
        default: 5, // 5% GST
    },
    priceWithGst: {
        type: Number,
        default: 0,
        min: 0,
    },
    advancePayment: {
        type: Number,
        default: 0,
        min: 0,
    },
    remainingPayment: {
        type: Number,
        default: 0,
        min: 0,
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

