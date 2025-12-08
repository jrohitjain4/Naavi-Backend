const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllPrices,
    getPriceById,
    getPrice,
    createPrice,
    updatePrice,
    deletePrice,
} = require('../controllers/priceController');

// Get price for specific boat, zone, and trip type (public - for frontend)
router.get('/get', getPrice);

// Get all prices (requires auth)
router.get('/', authenticate, getAllPrices);

// Get single price by ID (requires auth)
router.get('/:id', authenticate, getPriceById);

// Create price (requires auth)
router.post('/', authenticate, createPrice);

// Update price (requires auth)
router.put('/:id', authenticate, updatePrice);

// Delete price (requires auth)
router.delete('/:id', authenticate, deletePrice);

module.exports = router;

