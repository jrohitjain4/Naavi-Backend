const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    registerBoat,
    getDriverBoat,
} = require('../controllers/driverBoatController');
const { optionalDriverAuth } = require('../middleware/driverAuth');

// Configure multer for boat registration paper
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/boats/');
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

// Register boat
router.post(
    '/register',
    optionalDriverAuth,
    upload.single('boatRegistrationPaper'),
    registerBoat
);

// Get driver's boat
router.get('/my-boat', optionalDriverAuth, getDriverBoat);
router.get('/:driverId', optionalDriverAuth, getDriverBoat);

module.exports = router;

