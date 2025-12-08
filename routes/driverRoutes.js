const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllDrivers,
    getPendingDrivers,
    getDriverStats,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver,
    approveDriver,
    rejectDriver,
} = require('../controllers/driverController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get driver statistics
router.get('/stats', getDriverStats);

// Get pending drivers
router.get('/pending', getPendingDrivers);

// Get all drivers
router.get('/', getAllDrivers);

// Get single driver
router.get('/:id', getDriverById);

// Create driver
router.post('/', createDriver);

// Update driver
router.put('/:id', updateDriver);

// Approve driver
router.put('/:id/approve', approveDriver);

// Reject driver
router.put('/:id/reject', rejectDriver);

// Delete driver
router.delete('/:id', deleteDriver);

module.exports = router;

