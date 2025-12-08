const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllGhats,
    getGhatsByZoneId,
    getGhatById,
    createGhat,
    updateGhat,
    deleteGhat,
    bulkCreateGhats,
} = require('../controllers/ghatController');

// Get all ghats (public - for frontend)
router.get('/', getAllGhats);

// Get ghats by zone ID (public - for frontend)
router.get('/zone/:zoneId', getGhatsByZoneId);

// Get single ghat (public)
router.get('/:id', getGhatById);

// Create ghat (requires auth - admin only)
router.post('/', authenticate, createGhat);

// Bulk create ghats (requires auth - admin only)
router.post('/bulk', authenticate, bulkCreateGhats);

// Update ghat (requires auth - admin only)
router.put('/:id', authenticate, updateGhat);

// Delete ghat (requires auth - admin only)
router.delete('/:id', authenticate, deleteGhat);

module.exports = router;

