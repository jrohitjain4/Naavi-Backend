const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BoatType = require('../models/BoatType');

dotenv.config();

// Boat types data
const boatTypesData = [
  {
    boatType: 'Motor Boat Small',
    capacity: 10,
    numberOfBoats: 0, // Will be updated when actual boats are added
  },
  {
    boatType: 'Motor Boat Medium',
    capacity: 20,
    numberOfBoats: 0,
  },
  {
    boatType: 'Motor Boat Large',
    capacity: 30,
    numberOfBoats: 0,
  },
  {
    boatType: 'Motor Boat Extra Large',
    capacity: 40,
    numberOfBoats: 0,
  },
];

// Helper function to generate Boat Type ID
const generateBoatId = async () => {
  try {
    const lastBoatType = await BoatType.findOne().sort({ boatId: -1 });
    
    if (!lastBoatType || !lastBoatType.boatId) {
      return 'BOAT-001';
    }
    
    const lastNumber = parseInt(lastBoatType.boatId.split('-')[1]) || 0;
    const nextNumber = lastNumber + 1;
    
    return `BOAT-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating boat ID:', error);
    return `BOAT-${Date.now().toString().slice(-3)}`;
  }
};

async function populateBoatTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let boatTypeCounter = 0;
    let boatIdCounter = 1;

    // Create or update boat types
    for (const boatTypeData of boatTypesData) {
      // Check if boat type already exists
      const existingBoatType = await BoatType.findOne({ 
        boatType: boatTypeData.boatType 
      });
      
      if (existingBoatType) {
        // Update existing boat type
        existingBoatType.capacity = boatTypeData.capacity;
        // Don't update numberOfBoats if it's already set (preserve actual count)
        if (existingBoatType.numberOfBoats === 0 || existingBoatType.numberOfBoats === undefined) {
          existingBoatType.numberOfBoats = boatTypeData.numberOfBoats;
        }
        await existingBoatType.save();
        console.log(`✅ Updated ${existingBoatType.boatId}: ${boatTypeData.boatType} (Capacity: ${boatTypeData.capacity})`);
      } else {
        // Create new boat type
        const boatId = `BOAT-${String(boatIdCounter).padStart(3, '0')}`;
        boatIdCounter++;

        const boatType = new BoatType({
          boatId,
          boatType: boatTypeData.boatType,
          capacity: boatTypeData.capacity,
          numberOfBoats: boatTypeData.numberOfBoats,
        });

        await boatType.save();
        boatTypeCounter++;
        console.log(`✅ Created ${boatId}: ${boatTypeData.boatType} (Capacity: ${boatTypeData.capacity})`);
      }
    }

    console.log(`\n🎉 Successfully populated ${boatTypeCounter} new boat types and updated existing ones!`);
    
    // Display all boat types
    const allBoatTypes = await BoatType.find().sort({ boatId: 1 });
    console.log('\n📋 All Boat Types in Database:');
    allBoatTypes.forEach(bt => {
      console.log(`   ${bt.boatId}: ${bt.boatType} - Capacity: ${bt.capacity}, Number of Boats: ${bt.numberOfBoats}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating boat types:', error);
    process.exit(1);
  }
}

populateBoatTypes();

