const Booking = require('../models/Booking');
const { createAuditLog } = require('../middleware/auditLog');

// Helper function to generate next Booking ID
const generateBookingId = async () => {
    try {
        const lastBooking = await Booking.findOne().sort({ bookingId: -1 });
        
        if (!lastBooking || !lastBooking.bookingId) {
            return 'BOOK-001';
        }
        
        const lastNumber = parseInt(lastBooking.bookingId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        
        return `BOOK-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating booking ID:', error);
        return `BOOK-${Date.now().toString().slice(-3)}`;
    }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('userId', 'firstName lastName email phone')
            .populate('boatId', 'boatName type capacity')
            .populate('zoneId', 'zoneName city')
            .sort({ bookingDate: -1, createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get bookings by user ID
exports.getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const bookings = await Booking.find({ userId })
            .populate('userId', 'firstName lastName email mobileNumber phone')
            .populate('boatId', 'boatName type capacity')
            .populate('zoneId', 'zoneName city')
            .sort({ bookingDate: -1, createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone')
            .populate('boatId', 'boatName type capacity')
            .populate('zoneId', 'zoneName city');
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new booking
exports.createBooking = async (req, res) => {
    try {
        const {
            userId,
            boatId,
            boatName,
            boatType,
            seats,
            tripType,
            pickupPoint,
            zone,
            zoneId,
            bookingDate,
            totalPrice,
            pricePerCandidate,
            status,
            paymentMethod,
            couponId,
            couponCode,
            discountAmount,
            finalPrice,
            gstAmount,
            gstPercentage,
            priceWithGst,
            advancePayment,
            remainingPayment,
        } = req.body;

        // Generate booking ID automatically
        const bookingId = await generateBookingId();

        const newBooking = new Booking({
            bookingId,
            userId,
            boatId,
            boatName,
            boatType,
            seats,
            tripType,
            pickupPoint,
            zone,
            zoneId: zoneId || null,
            bookingDate: new Date(bookingDate),
            totalPrice,
            pricePerCandidate,
            status: status || 'Pending',
            paymentMethod: paymentMethod || 'Pay Later',
            couponId: couponId || null,
            couponCode: couponCode || null,
            discountAmount: discountAmount || 0,
            finalPrice: finalPrice || totalPrice,
            gstAmount: gstAmount || 0,
            gstPercentage: gstPercentage || 5,
            priceWithGst: priceWithGst || (finalPrice || totalPrice),
            advancePayment: advancePayment || 0,
            remainingPayment: remainingPayment || 0,
        });

        // Update coupon usage if applied
        if (couponId) {
            const Coupon = require('../models/Coupon');
            const coupon = await Coupon.findById(couponId);
            if (coupon) {
                coupon.currentUses = (coupon.currentUses || 0) + 1;
                await coupon.save();
            }
        }

        await newBooking.save();

        // Populate before sending response
        await newBooking.populate('userId', 'firstName lastName email phone');
        await newBooking.populate('boatId', 'boatName type capacity');
        await newBooking.populate('zoneId', 'zoneName city');

        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'Customer',
            email: req.user?.email,
            userId: req.user?._id?.toString() || userId?.toString() || '',
            action: 'Created Booking',
            module: 'Bookings',
            details: `${newBooking.bookingId} - ${newBooking.boatName} for ${newBooking.seats} seats`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: newBooking._id.toString(),
            entityType: 'Booking',
        });

        res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update booking
exports.updateBooking = async (req, res) => {
    try {
        const {
            seats,
            tripType,
            pickupPoint,
            bookingDate,
            status,
            driverId,
        } = req.body;

        const booking = await Booking.findById(req.params.id)
            .populate('boatId', 'assignedDriverId');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update fields
        if (seats !== undefined) booking.seats = seats;
        if (tripType) booking.tripType = tripType;
        if (pickupPoint) booking.pickupPoint = pickupPoint;
        if (bookingDate) booking.bookingDate = new Date(bookingDate);
        if (status) booking.status = status;
        if (driverId) booking.driverId = driverId;

        // If status is being set to Completed, automatically set driverId and completedAt
        if (status === 'Completed' && !booking.driverId) {
            // Get driver from boat if not provided
            const driverIdFromBoat = booking.boatId?.assignedDriverId;
            if (driverIdFromBoat) {
                booking.driverId = driverIdFromBoat;
            }
            booking.completedAt = new Date();
        }

        // Recalculate total price if seats changed
        if (seats !== undefined) {
            booking.totalPrice = booking.pricePerCandidate * seats;
        }

        await booking.save();

        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Updated Booking',
            module: 'Bookings',
            details: `${booking.bookingId} - ${booking.boatName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: booking._id.toString(),
            entityType: 'Booking',
        });

        res.status(200).json({ message: 'Booking updated successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = 'Cancelled';
        await booking.save();

        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'System',
            email: req.user?.email,
            userId: req.user?._id?.toString() || '',
            action: 'Cancelled Booking',
            module: 'Bookings',
            details: `${booking.bookingId} - ${booking.boatName}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: booking._id.toString(),
            entityType: 'Booking',
        });

        res.status(200).json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
    try {
        const total = await Booking.countDocuments();
        const pending = await Booking.countDocuments({ status: 'Pending' });
        const confirmed = await Booking.countDocuments({ status: 'Confirmed' });
        const completed = await Booking.countDocuments({ status: 'Completed' });
        const cancelled = await Booking.countDocuments({ status: 'Cancelled' });

        res.status(200).json({
            total,
            pending,
            confirmed,
            completed,
            cancelled,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Clear all bookings (for development/testing)
exports.clearAllBookings = async (req, res) => {
    try {
        const result = await Booking.deleteMany({});
        res.status(200).json({
            message: 'All bookings cleared successfully',
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

