const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
    },
    action: {
        type: String,
        required: true,
    },
    module: {
        type: String,
        required: true,
    },
    details: {
        type: String,
    },
    ipAddress: {
        type: String,
    },
    entityId: {
        type: String,
    },
    entityType: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

