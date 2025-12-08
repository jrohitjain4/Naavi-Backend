const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function fixBoatIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected');

        const db = mongoose.connection.db;
        const boatsCollection = db.collection('boats');

        // Get all indexes
        const indexes = await boatsCollection.indexes();
        console.log('Current indexes:', indexes);

        // Drop the registration index if it exists
        try {
            await boatsCollection.dropIndex('registration_1');
            console.log('✅ Dropped registration_1 index');
        } catch (error) {
            if (error.code === 27 || error.codeName === 'IndexNotFound') {
                console.log('ℹ️  registration_1 index does not exist (already removed)');
            } else {
                console.error('Error dropping registration index:', error.message);
            }
        }

        // Drop any other old indexes that might exist
        const oldIndexes = ['boatName_1', 'assignedDriver_1', 'zone_1', 'status_1'];
        for (const indexName of oldIndexes) {
            try {
                await boatsCollection.dropIndex(indexName);
                console.log(`✅ Dropped ${indexName} index`);
            } catch (error) {
                if (error.code === 27 || error.codeName === 'IndexNotFound') {
                    // Index doesn't exist, that's fine
                } else {
                    console.error(`Error dropping ${indexName} index:`, error.message);
                }
            }
        }

        // List remaining indexes
        const remainingIndexes = await boatsCollection.indexes();
        console.log('\n✅ Remaining indexes:', remainingIndexes.map(idx => idx.name));

        console.log('\n✅ Boat indexes fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing indexes:', error);
        process.exit(1);
    }
}

fixBoatIndexes();

