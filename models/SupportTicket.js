const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true,
    },
    customer: {
        type: String,
        required: true,
    },
    customerId: {
        type: String,
    },
    subject: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    priority: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open',
    },
    assignedTo: {
        type: String,
        default: 'Support Team',
    },
    responseTime: {
        type: Number, // in hours
        default: 0,
    },
    resolvedAt: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

