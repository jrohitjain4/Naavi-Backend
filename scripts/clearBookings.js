const mongoose = require('mongoose');
const Booking = require('../models/Booking');
require('dotenv').config();

// MongoDB connection - use same as server.js
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/navi';

async function clearBookings() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Delete all bookings
        const result = await Booking.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} bookings`);

        // Close connection
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing bookings:', error);
        process.exit(1);
    }
}

// Run the script
clearBookings();

