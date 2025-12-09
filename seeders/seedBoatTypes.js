const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BoatType = require('../models/BoatType');
const Boat = require('../models/Boat');

dotenv.config();

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

async function seedBoatTypes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Check if boat types have associated boats
        console.log('🔍 Step 1: Checking for associated boats...');
        const existingBoatTypes = await BoatType.find({});
        
        let hasAssociatedBoats = false;
        for (const boatType of existingBoatTypes) {
            const boatsCount = await Boat.countDocuments({ boatTypeId: boatType._id });
            if (boatsCount > 0) {
                hasAssociatedBoats = true;
                console.log(`⚠️  Warning: BoatType ${boatType.boatId} (${boatType.boatType}) has ${boatsCount} boat(s) assigned.`);
                console.log(`   Boats will remain but boatType reference will be broken if deleted.`);
            }
        }
        
        if (hasAssociatedBoats) {
            console.log(`\n⚠️  WARNING: Some boat types have associated boats!`);
            console.log(`   Consider reassigning boats after seeding.\n`);
        }

        // Step 2: Delete all existing boat types
        console.log('🗑️  Step 2: Deleting existing boat types...');
        const deletedBoatTypes = await BoatType.deleteMany({});
        console.log(`✅ Deleted ${deletedBoatTypes.deletedCount} boat type(s)\n`);

        // Step 3: Create boat types
        console.log('📝 Step 3: Creating boat types...\n');
        
        let totalCreated = 0;
        
        for (const boatTypeData of boatTypesData) {
            // Generate boat ID
            const boatId = await generateBoatId();
            
            // Create boat type
            const newBoatType = new BoatType({
                boatId,
                boatType: boatTypeData.boatType,
                capacity: boatTypeData.capacity,
                numberOfBoats: boatTypeData.numberOfBoats,
            });
            
            await newBoatType.save();
            totalCreated++;
            console.log(`✅ Created ${boatId}: ${boatTypeData.boatType}`);
            console.log(`   Capacity: ${boatTypeData.capacity} passengers`);
            console.log(`   Number of Boats: ${boatTypeData.numberOfBoats}\n`);
        }

        console.log('\n🎉 Seeding completed successfully!');
        console.log(`✅ Created ${totalCreated} boat type(s)`);
        console.log('\n📊 Summary:');
        
        // Show summary
        const allBoatTypes = await BoatType.find().sort({ boatId: 1 });
        for (const boatType of allBoatTypes) {
            const boatsCount = await Boat.countDocuments({ boatTypeId: boatType._id });
            console.log(`   ${boatType.boatId} - ${boatType.boatType}: Capacity ${boatType.capacity}, ${boatsCount} actual boat(s)`);
        }
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during seeding:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run seeder
seedBoatTypes();

