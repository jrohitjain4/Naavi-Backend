const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    completeProfile,
    getProfile,
} = require('../controllers/driverProfileController');
const { optionalDriverAuth } = require('../middleware/driverAuth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/drivers/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png) and PDF files are allowed'));
        }
    }
});

// Complete profile (with file uploads)
router.post(
    '/complete',
    optionalDriverAuth,
    upload.fields([
        { name: 'aadharCard', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'boatDrivingLicense', maxCount: 1 },
    ]),
    completeProfile
);

// Get profile
router.get('/profile', optionalDriverAuth, getProfile);
router.get('/profile/:id', optionalDriverAuth, getProfile);

module.exports = router;

