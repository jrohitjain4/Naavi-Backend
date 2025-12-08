const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllBookings,
    getBookingStats,
    getBookingById,
    getUserBookings,
    createBooking,
    updateBooking,
    cancelBooking,
    clearAllBookings,
} = require('../controllers/bookingController');

// Get booking statistics (requires auth)
router.get('/stats', authenticate, getBookingStats);

// Get all bookings (requires auth for admin)
router.get('/', authenticate, getAllBookings);

// Get bookings by user ID (public - user can see their own bookings)
router.get('/user/:userId', getUserBookings);

// Get single booking (public)
router.get('/:id', getBookingById);

// Create booking (public - no auth required)
router.post('/', createBooking);

// Update booking (requires auth)
router.put('/:id', authenticate, updateBooking);

// Cancel booking (public - user can cancel their own booking)
router.put('/:id/cancel', cancelBooking);

// Clear all bookings (for development/testing - requires auth)
router.delete('/clear', authenticate, clearAllBookings);

module.exports = router;

