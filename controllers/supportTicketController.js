const SupportTicket = require('../models/SupportTicket');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate Ticket ID
const generateTicketId = async () => {
    try {
        // Find the last ticket to get the highest number
        const lastTicket = await SupportTicket.findOne({ ticketId: { $exists: true, $ne: null } })
            .sort({ ticketId: -1 });
        
        if (!lastTicket || !lastTicket.ticketId) {
            // First ticket
            return 'TKT-001';
        }
        
        // Extract number from last ticket ID (e.g., "TKT-001" -> 1)
        const lastNumber = parseInt(lastTicket.ticketId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        
        // Format as TKT-XXX (3 digits with leading zeros)
        return `TKT-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating ticket ID:', error);
        // Fallback: use timestamp-based ID
        return `TKT-${Date.now().toString().slice(-3)}`;
    }
};

// Get all tickets
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get ticket statistics
exports.getTicketStats = async (req, res) => {
    try {
        const open = await SupportTicket.countDocuments({ status: 'Open' });
        const inProgress = await SupportTicket.countDocuments({ status: 'In Progress' });
        
        // Resolved today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resolvedToday = await SupportTicket.countDocuments({
            status: 'Resolved',
            resolvedAt: { $gte: today }
        });
        
        // Average response time (in hours)
        const allTickets = await SupportTicket.find({ responseTime: { $gt: 0 } });
        const avgResponseTime = allTickets.length > 0
            ? (allTickets.reduce((sum, ticket) => sum + (ticket.responseTime || 0), 0) / allTickets.length).toFixed(1)
            : 0;
        
        res.status(200).json({
            open,
            inProgress,
            resolvedToday,
            avgResponseTime: parseFloat(avgResponseTime),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single ticket by ID
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new ticket
exports.createTicket = async (req, res) => {
    try {
        const { customer, customerId, subject, description, priority, assignedTo } = req.body;
        
        // Generate ticket ID automatically
        const ticketId = await generateTicketId();
        
        const newTicket = new SupportTicket({
            ticketId,
            customer,
            customerId: customerId || '',
            subject,
            description: description || '',
            priority: priority || 'Medium',
            status: 'Open',
            assignedTo: assignedTo || 'Support Team',
            responseTime: 0,
        });
        
        await newTicket.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Created Ticket',
            module: 'Support Tickets',
            details: `${newTicket.ticketId} - ${newTicket.subject}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newTicket._id.toString(),
            entityType: 'SupportTicket',
        });
        
        res.status(201).json({ message: 'Ticket created successfully', ticket: newTicket });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ticket ID already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update ticket
exports.updateTicket = async (req, res) => {
    try {
        const { customer, subject, description, priority, status, assignedTo } = req.body;
        
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        // Update fields (ticketId cannot be changed)
        ticket.customer = customer || ticket.customer;
        ticket.subject = subject || ticket.subject;
        ticket.description = description !== undefined ? description : ticket.description;
        ticket.priority = priority || ticket.priority;
        ticket.status = status || ticket.status;
        ticket.assignedTo = assignedTo || ticket.assignedTo;
        
        // If status is Resolved, set resolvedAt and calculate response time
        if (status === 'Resolved' && !ticket.resolvedAt) {
            ticket.resolvedAt = new Date();
            const responseTimeMs = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
            ticket.responseTime = responseTimeMs / (1000 * 60 * 60); // Convert to hours
        }
        
        await ticket.save();
        
        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Ticket',
            module: 'Support Tickets',
            details: `${ticket.ticketId} - ${ticket.subject}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: ticket._id.toString(),
            entityType: 'SupportTicket',
        });
        
        res.status(200).json({ message: 'Ticket updated successfully', ticket });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ticket ID already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete ticket
exports.deleteTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        // Create audit log before deletion
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Deleted Ticket',
            module: 'Support Tickets',
            details: `${ticket.ticketId} - ${ticket.subject}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: ticket._id.toString(),
            entityType: 'SupportTicket',
        });
        
        await SupportTicket.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

