const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllCustomers,
    getCustomerStats,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} = require('../controllers/customerController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get customer statistics
router.get('/stats', getCustomerStats);

// Get all customers
router.get('/', getAllCustomers);

// Get single customer
router.get('/:id', getCustomerById);

// Update customer
router.put('/:id', updateCustomer);

// Delete customer
router.delete('/:id', deleteCustomer);

module.exports = router;

