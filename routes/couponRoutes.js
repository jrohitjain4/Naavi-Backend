const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getAllCoupons,
    getCouponStats,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    getActiveCoupons,
} = require('../controllers/couponController');

// Public routes (no auth required)
router.post('/validate', validateCoupon);
router.get('/active', getActiveCoupons);

// Apply authentication middleware to protected routes
router.use(authenticate);

// Get coupon statistics
router.get('/stats', getCouponStats);

// Get all coupons
router.get('/', getAllCoupons);

// Get single coupon
router.get('/:id', getCouponById);

// Create coupon
router.post('/', createCoupon);

// Update coupon
router.put('/:id', updateCoupon);

// Delete coupon
router.delete('/:id', deleteCoupon);

module.exports = router;

