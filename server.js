const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const boatRoutes = require('./routes/boatRoutes');
const customerRoutes = require('./routes/customerRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const driverRoutes = require('./routes/driverRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const couponRoutes = require('./routes/couponRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const ghatRoutes = require('./routes/ghatRoutes');
const priceRoutes = require('./routes/priceRoutes');
const driverAuthRoutes = require('./routes/driverAuthRoutes');
const driverProfileRoutes = require('./routes/driverProfileRoutes');
const driverBoatRoutes = require('./routes/driverBoatRoutes');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Middlewares
app.use(cors()); // Allow requests from other origins
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("MongoDB connected successfully!");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

// Routes
app.use('/api', authRoutes); // All auth routes will start with /api
app.use('/api/admin', adminRoutes); // Admin routes
app.use('/api/boats', boatRoutes); // Boat routes
app.use('/api/bookings', bookingRoutes); // Booking routes
app.use('/api/customers', customerRoutes); // Customer routes
app.use('/api/zones', zoneRoutes); // Zone routes
app.use('/api/drivers', driverRoutes); // Driver routes
app.use('/api/support-tickets', supportTicketRoutes); // Support Ticket routes
app.use('/api/audit-logs', auditLogRoutes); // Audit Log routes
app.use('/api/coupons', couponRoutes); // Coupon routes
app.use('/api/reviews', reviewRoutes); // Review routes
app.use('/api/ghats', ghatRoutes); // Ghat routes
app.use('/api/prices', priceRoutes); // Price routes
app.use('/api/driver-auth', driverAuthRoutes); // Driver authentication routes
app.use('/api/driver-profile', driverProfileRoutes); // Driver profile routes
app.use('/api/driver-boat', driverBoatRoutes); // Driver boat registration routes

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server accessible at: http://192.168.1.22:${PORT}`);
});