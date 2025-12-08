const AuditLog = require('../models/AuditLog');

// Get all audit logs
exports.getAllLogs = async (req, res) => {
    try {
        const { module, startDate, endDate, search } = req.query;
        
        let query = {};
        
        // Module filter
        if (module && module !== 'all') {
            query.module = module;
        }
        
        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }
        
        // Search filter
        if (search) {
            query.$or = [
                { user: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
                { module: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
            ];
        }
        
        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(1000); // Limit to last 1000 logs
        
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get audit log statistics
exports.getLogStats = async (req, res) => {
    try {
        const total = await AuditLog.countDocuments();
        
        // Get unique modules
        const modules = await AuditLog.distinct('module');
        
        // Get logs by module count
        const moduleCounts = {};
        for (const module of modules) {
            moduleCounts[module] = await AuditLog.countDocuments({ module });
        }
        
        // Get today's logs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLogs = await AuditLog.countDocuments({
            timestamp: { $gte: today }
        });
        
        res.status(200).json({
            total,
            todayLogs,
            modules,
            moduleCounts,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single log by ID
exports.getLogById = async (req, res) => {
    try {
        const log = await AuditLog.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

