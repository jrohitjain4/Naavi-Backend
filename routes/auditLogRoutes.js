const express = require('express');
const router = express.Router();
const {
    getAllLogs,
    getLogStats,
    getLogById,
} = require('../controllers/auditLogController');

// Get log statistics
router.get('/stats', getLogStats);

// Get all logs
router.get('/', getAllLogs);

// Get single log
router.get('/:id', getLogById);

module.exports = router;

