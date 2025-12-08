const AuditLog = require('../models/AuditLog');

/**
 * Create audit log entry
 * @param {Object} logData - Log data object
 */
const createAuditLog = async (logData) => {
    try {
        // Use email if available, otherwise use name, otherwise use 'System'
        const userDisplay = logData.user || logData.email || 'System';
        
        const auditLog = new AuditLog({
            timestamp: new Date(),
            user: userDisplay,
            userId: logData.userId || '',
            action: logData.action,
            module: logData.module,
            details: logData.details || '',
            ipAddress: logData.ipAddress || '',
            entityId: logData.entityId || '',
            entityType: logData.entityType || '',
        });
        await auditLog.save();
        console.log(`Audit log created: ${logData.action} by ${userDisplay}`);
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw error - audit logging should not break the main flow
    }
};

/**
 * Middleware to log actions
 */
const logAction = (module, action, getDetails) => {
    return async (req, res, next) => {
        // Execute the original function first
        const originalSend = res.json;
        res.json = function(data) {
            // Log after response is sent
            const user = req.user?.email || req.user?.name || 'System';
            const userId = req.user?._id || '';
            const ipAddress = req.ip || req.connection.remoteAddress || '';
            
            let details = '';
            if (getDetails && typeof getDetails === 'function') {
                details = getDetails(req, data);
            } else if (req.body) {
                details = JSON.stringify(req.body).substring(0, 200);
            }
            
            createAuditLog({
                user,
                userId,
                action,
                module,
                details,
                ipAddress,
                entityId: req.params?.id || '',
                entityType: module,
            });
            
            return originalSend.call(this, data);
        };
        next();
    };
};

module.exports = {
    createAuditLog,
    logAction,
};

