const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Zone = require('../models/Zone');

// Load environment variables
dotenv.config();

// Zone-wise boarding points data
const boardingPointsData = {
  'ZONE-001': ['Assi Ghat'],
  'ZONE-002': ['Nishadraj (Nishad) Ghat'],
  'ZONE-003': ['Shivala Ghat'],
  'ZONE-004': ['Harishchandra Ghat'],
  'ZONE-005': ['Kedar Ghat'],
  'ZONE-006': ['Pande (Pandey) Ghat'],
  'ZONE-007': ['Dashashwamdh Ghat'],
  'ZONE-008': ['Mir Ghat'],
  'ZONE-009': ['Scindia Ghat'],
  'ZONE-010': ['Mehta Ghat'],
  'ZONE-011': ['Mangala Gauri Panchganga Ghat'],
  'ZONE-012': ['Gai (Gaya) Ghat'],
  'ZONE-013': ['Prahlad Ghat'],
  'ZONE-014': ['Namo Ghat'],
  'ZONE-015': ['Sant Ravidas Ghat'],
};

async function populateBoardingPoints() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Update each zone with boarding points
    for (const [zoneId, boardingPoints] of Object.entries(boardingPointsData)) {
      const zone = await Zone.findOne({ zoneId });
      
      if (zone) {
        zone.boardingPoints = boardingPoints;
        await zone.save();
        console.log(`✅ Updated ${zoneId} (${zone.zoneName}) with boarding points: ${boardingPoints.join(', ')}`);
      } else {
        console.log(`⚠️  Zone ${zoneId} not found`);
      }
    }

    console.log('\n🎉 Successfully populated all zones with boarding points!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating boarding points:', error);
    process.exit(1);
  }
}

// Run the script
populateBoardingPoints();

