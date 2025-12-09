const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Zone = require('../models/Zone');
const Ghat = require('../models/Ghat');

dotenv.config();

/**
 * Check zone data structure in database
 */
async function checkZoneData() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/navi';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Get all zones using raw MongoDB query to see actual data
        const zones = await Zone.find().sort({ zoneId: 1 });
        console.log(`📋 Found ${zones.length} zones\n`);

        for (const zone of zones) {
            console.log(`\n🔍 Zone: ${zone.zoneId} - ${zone.zoneName}`);
            console.log(`   _id: ${zone._id}`);
            console.log(`   ghats array:`, JSON.stringify(zone.ghats, null, 2));
            console.log(`   totalGhats: ${zone.totalGhats}`);
            
            // Check ghats in Ghat collection
            const ghatsFromModel = await Ghat.find({ zoneId: zone._id }).select('ghatId ghatName -_id');
            console.log(`   Ghats in Ghat model: ${ghatsFromModel.length}`);
            ghatsFromModel.forEach(g => {
                console.log(`     - ${g.ghatId}: ${g.ghatName}`);
            });
            
            // Check if zone.ghats has name fields
            if (zone.ghats && Array.isArray(zone.ghats)) {
                zone.ghats.forEach((ghat, index) => {
                    if (ghat.name) {
                        console.log(`   ⚠️  WARNING: ghats[${index}] has 'name' field:`, ghat);
                    }
                    if (!ghat.ghatId) {
                        console.log(`   ⚠️  WARNING: ghats[${index}] missing 'ghatId':`, ghat);
                    }
                });
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the check
checkZoneData();

