const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Zone = require('../models/Zone');
const Ghat = require('../models/Ghat');

dotenv.config();

/**
 * Clean up zones: Ensure ghats array only contains ghatId (not name)
 * This script fixes zones that have ghats with name fields from old data
 */
async function cleanZoneGhats() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/navi';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Get all zones
        const zones = await Zone.find();
        console.log(`\n📋 Found ${zones.length} zones to check`);

        let cleanedCount = 0;
        let errorCount = 0;

        for (const zone of zones) {
            try {
                // Get ghats from Ghat collection for this zone
                const ghatsFromModel = await Ghat.find({ zoneId: zone._id }).select('ghatId -_id');
                const validGhatIds = ghatsFromModel.map(g => g.ghatId);

                // Check if zone.ghats has invalid data (has name field or wrong structure)
                let needsUpdate = false;
                const cleanedGhats = [];

                if (zone.ghats && Array.isArray(zone.ghats)) {
                    for (const ghat of zone.ghats) {
                        // If ghat has name field, it's invalid
                        if (ghat.name) {
                            needsUpdate = true;
                            // Try to find the ghatId from the name
                            const matchingGhat = await Ghat.findOne({ 
                                zoneId: zone._id, 
                                ghatName: ghat.name 
                            });
                            if (matchingGhat && matchingGhat.ghatId) {
                                cleanedGhats.push({ ghatId: matchingGhat.ghatId });
                            }
                        } else if (ghat.ghatId) {
                            // Valid structure, keep it
                            if (validGhatIds.includes(ghat.ghatId)) {
                                cleanedGhats.push({ ghatId: ghat.ghatId });
                            } else {
                                needsUpdate = true; // Remove invalid ghatId
                            }
                        } else {
                            // Invalid structure
                            needsUpdate = true;
                        }
                    }
                }

                // If zone.ghats is empty but we have ghats in Ghat model, populate it
                if ((!zone.ghats || zone.ghats.length === 0) && validGhatIds.length > 0) {
                    needsUpdate = true;
                    cleanedGhats.push(...validGhatIds.map(id => ({ ghatId: id })));
                }

                // If we need to update, save the zone
                if (needsUpdate || cleanedGhats.length !== zone.ghats?.length) {
                    zone.ghats = cleanedGhats;
                    zone.totalGhats = cleanedGhats.length;
                    await zone.save();
                    console.log(`  ✅ Cleaned zone ${zone.zoneId} (${zone.zoneName}): ${cleanedGhats.length} ghats`);
                    cleanedCount++;
                } else {
                    console.log(`  ✓ Zone ${zone.zoneId} (${zone.zoneName}) is already clean`);
                }
            } catch (error) {
                console.error(`  ❌ Error cleaning zone ${zone.zoneId}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   - Cleaned: ${cleanedCount} zones`);
        console.log(`   - Already clean: ${zones.length - cleanedCount - errorCount} zones`);
        console.log(`   - Errors: ${errorCount} zones`);

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the cleanup
cleanZoneGhats();

