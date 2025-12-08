const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const { createAuditLog } = require('../middleware/auditLog');

// Create review
exports.createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;
        const userId = req.body.userId || req.user?._id?.toString();

        if (!bookingId || !rating || !userId) {
            return res.status(400).json({ 
                message: 'Booking ID, rating, and user ID are required' 
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                message: 'Rating must be between 1 and 5' 
            });
        }

        // Check if booking exists and is completed
        const booking = await Booking.findById(bookingId)
            .populate('boatId', 'assignedDriverId');
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'Completed') {
            return res.status(400).json({ 
                message: 'Can only review completed bookings' 
            });
        }

        // Check if user owns this booking
        if (booking.userId.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'You can only review your own bookings' 
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return res.status(400).json({ 
                message: 'Review already exists for this booking' 
            });
        }

        // Get driver ID from booking or boat
        const driverId = booking.driverId || booking.boatId?.assignedDriverId;
        
        if (!driverId) {
            return res.status(400).json({ 
                message: 'Driver not assigned to this booking' 
            });
        }

        // Get boatId - handle both populated and unpopulated cases
        let boatId;
        if (booking.boatId) {
            // If populated, it's an object with _id, otherwise it's just the ObjectId
            boatId = booking.boatId._id || booking.boatId;
        } else {
            return res.status(400).json({ 
                message: 'Boat not found for this booking' 
            });
        }

        // Create review
        const review = new Review({
            bookingId,
            userId,
            driverId: driverId.toString(),
            boatId: boatId,
            rating,
            comment: comment || null,
            status: 'Approved',
        });

        await review.save();

        // Update booking with review ID
        booking.reviewId = review._id;
        await booking.save();

        // Update driver rating
        const driver = await Driver.findById(driverId);
        if (driver) {
            // Get all reviews for this driver
            const allReviews = await Review.find({ 
                driverId: driverId.toString(),
                status: 'Approved' 
            });
            
            // Calculate average rating
            const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = allReviews.length > 0 
                ? (totalRating / allReviews.length).toFixed(1) 
                : rating;
            
            driver.rating = parseFloat(averageRating);
            driver.totalTrips = allReviews.length;
            await driver.save();
        }

        // Create audit log
        await createAuditLog({
            user: req.user?.email || req.user?.name || 'Customer',
            email: req.user?.email,
            userId: userId.toString(),
            action: 'Created Review',
            module: 'Reviews',
            details: `Rating: ${rating} for booking ${booking.bookingId}`,
            ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '',
            entityId: review._id.toString(),
            entityType: 'Review',
        });

        // Populate review before sending
        await review.populate('driverId', 'firstName lastName');
        await review.populate('userId', 'firstName lastName');

        res.status(201).json({ 
            message: 'Review created successfully', 
            review 
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get review by booking ID
exports.getReviewByBookingId = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findOne({ bookingId: id })
            .populate('driverId', 'firstName lastName')
            .populate('userId', 'firstName lastName');
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all reviews for a driver
exports.getDriverReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const reviews = await Review.find({ 
            driverId: id,
            status: 'Approved' 
        })
            .populate('userId', 'firstName lastName')
            .populate('bookingId', 'bookingId')
            .sort({ createdAt: -1 });
        
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all reviews by a user
exports.getUserReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const reviews = await Review.find({ userId: id })
            .populate('driverId', 'firstName lastName')
            .populate('bookingId', 'bookingId')
            .sort({ createdAt: -1 });
        
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update review
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.body.userId || req.user?._id?.toString();

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user owns this review
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: 'You can only update your own reviews' 
            });
        }

        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ 
                    message: 'Rating must be between 1 and 5' 
                });
            }
            review.rating = rating;
        }

        if (comment !== undefined) {
            review.comment = comment;
        }

        await review.save();

        // Update driver rating if rating changed
        if (rating !== undefined) {
            const driver = await Driver.findById(review.driverId);
            if (driver) {
                const allReviews = await Review.find({ 
                    driverId: review.driverId,
                    status: 'Approved' 
                });
                
                const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
                const averageRating = allReviews.length > 0 
                    ? (totalRating / allReviews.length).toFixed(1) 
                    : 0;
                
                driver.rating = parseFloat(averageRating);
                await driver.save();
            }
        }

        res.status(200).json({ 
            message: 'Review updated successfully', 
            review 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all reviews (admin only)
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('bookingId', 'bookingId boatName tripType bookingDate')
            .populate('userId', 'firstName lastName email phone mobileNumber')
            .populate('driverId', 'firstName lastName phone driverId')
            .populate('boatId', 'boatName type')
            .sort({ createdAt: -1 });
        
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete review (admin only)
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const driverId = review.driverId;
        
        await Review.findByIdAndDelete(id);

        // Update booking
        await Booking.updateOne(
            { _id: review.bookingId },
            { $unset: { reviewId: 1 } }
        );

        // Update driver rating
        const driver = await Driver.findById(driverId);
        if (driver) {
            const allReviews = await Review.find({ 
                driverId: driverId,
                status: 'Approved' 
            });
            
            const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = allReviews.length > 0 
                ? (totalRating / allReviews.length).toFixed(1) 
                : 0;
            
            driver.rating = parseFloat(averageRating);
            driver.totalTrips = allReviews.length;
            await driver.save();
        }

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

