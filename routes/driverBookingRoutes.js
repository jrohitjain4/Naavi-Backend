const express = require('express');
const router = express.Router();
const { authenticateDriver } = require('../middleware/driverAuth');
const { getAvailableBookingsForDriver, acceptBooking, finishRide } = require('../controllers/driverBookingController');

// Get pending bookings available for driver (zone-based by default)
router.get('/available', authenticateDriver, getAvailableBookingsForDriver);

// Accept a booking (locks to driver, marks driver OnDuty)
router.post('/:bookingId/accept', authenticateDriver, acceptBooking);

// Finish a ride (marks booking Completed, driver Available)
router.post('/:bookingId/finish', authenticateDriver, finishRide);

module.exports = router;


