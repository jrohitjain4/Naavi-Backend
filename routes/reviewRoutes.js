const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    createReview,
    getAllReviews,
    getReviewByBookingId,
    getDriverReviews,
    getUserReviews,
    updateReview,
    deleteReview,
} = require('../controllers/reviewController');

// Get all reviews (requires auth - admin only)
router.get('/all', authenticate, getAllReviews);

// Create review (public - user can review their own booking)
router.post('/', createReview);

// Get review by booking ID (public)
router.get('/booking/:id', getReviewByBookingId);

// Get all reviews for a driver (public)
router.get('/driver/:id', getDriverReviews);

// Get all reviews by a user (public)
router.get('/user/:id', getUserReviews);

// Update review (public - user can update their own review)
router.put('/:id', updateReview);

// Delete review (requires auth - admin only)
router.delete('/:id', authenticate, deleteReview);

module.exports = router;

