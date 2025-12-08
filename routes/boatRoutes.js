const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllBoats,
    getBoatStats,
    getBoatById,
    createBoat,
    updateBoat,
    deleteBoat,
} = require('../controllers/boatController');

// Get boat statistics (requires auth)
router.get('/stats', authenticate, getBoatStats);

// Get all boats (public - no auth required)
router.get('/', getAllBoats);

// Get single boat (public)
router.get('/:id', getBoatById);

// Create boat (requires auth)
router.post('/', authenticate, createBoat);

// Update boat (requires auth)
router.put('/:id', authenticate, updateBoat);

// Delete boat (requires auth)
router.delete('/:id', authenticate, deleteBoat);

module.exports = router;

