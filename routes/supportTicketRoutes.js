const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllTickets,
    getTicketStats,
    getTicketById,
    createTicket,
    updateTicket,
    deleteTicket,
} = require('../controllers/supportTicketController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get ticket statistics
router.get('/stats', getTicketStats);

// Get all tickets
router.get('/', getAllTickets);

// Get single ticket
router.get('/:id', getTicketById);

// Create ticket
router.post('/', createTicket);

// Update ticket
router.put('/:id', updateTicket);

// Delete ticket
router.delete('/:id', deleteTicket);

module.exports = router;

