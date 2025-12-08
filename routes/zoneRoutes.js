const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllZones,
    getZoneStats,
    getZoneById,
    createZone,
    updateZone,
    deleteZone,
} = require('../controllers/zoneController');

// Public routes (for driver app)
// Get all zones (public - for driver zone selection)
router.get('/', getAllZones);

// Get single zone (public)
router.get('/:id', getZoneById);

// Protected routes (admin only)
// Get zone statistics
router.get('/stats', authenticate, getZoneStats);

// Create zone
router.post('/', createZone);

// Update zone
router.put('/:id', updateZone);

// Delete zone
router.delete('/:id', deleteZone);

module.exports = router;

