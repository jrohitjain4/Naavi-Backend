const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Price = require('../models/Price');
const BoatType = require('../models/BoatType');
const Zone = require('../models/Zone');

dotenv.config();

// Base prices for Full Trip (per boat type)
const fullTripPrices = {
    'Motor Boat Small': 1000,
    'Motor Boat Medium': 2000,
    'Motor Boat Large': 3000,
    'Motor Boat Extra Large': 4000,
};

// Trip types
const tripTypes = ['Full Trip', 'Half Trip', 'Cross Trip'];

async function seedPrices() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Check prerequisites
        console.log('🔍 Step 1: Checking prerequisites...');
        
        // Get all boat types
        const boatTypes = await BoatType.find();
        if (boatTypes.length === 0) {
            console.log('❌ No boat types found. Please run seed:boatTypes first.');
            await mongoose.connection.close();
            process.exit(1);
        }
        console.log(`✅ Found ${boatTypes.length} boat type(s)`);

        // Note: We're creating only global prices (All Zones), so zones are not needed
        console.log(`ℹ️  Creating only global prices (All Zones)`);

        // Step 2: Delete all existing prices
        console.log('\n🗑️  Step 2: Deleting existing prices...');
        const deletedPrices = await Price.deleteMany({});
        console.log(`✅ Deleted ${deletedPrices.deletedCount} price(s)\n`);

        // Step 3: Create prices (only global prices - All Zones)
        console.log('📝 Step 3: Creating global prices (All Zones)...\n');
        
        let totalCreated = 0;
        let skippedCount = 0;

        // Create only global prices (zoneId = null) for each boat type and trip type
        for (const boatType of boatTypes) {
            const basePrice = fullTripPrices[boatType.boatType];
            
            if (!basePrice) {
                console.log(`⚠️  No base price defined for ${boatType.boatType}, skipping...`);
                skippedCount++;
                continue;
            }

            console.log(`📦 Processing ${boatType.boatType} (Base Price: ₹${basePrice})...`);

            for (const tripType of tripTypes) {
                // Calculate price based on trip type
                let price;
                if (tripType === 'Full Trip') {
                    price = basePrice;
                } else if (tripType === 'Half Trip') {
                    price = Math.round(basePrice / 2);
                } else if (tripType === 'Cross Trip') {
                    price = basePrice * 2;
                }

                // Create only global price (zoneId = null) for each boat type and trip type
                const globalPrice = new Price({
                    boatTypeId: boatType._id,
                    zoneId: null,
                    tripType: tripType,
                    price: price,
                    isActive: true,
                });

                await globalPrice.save();
                totalCreated++;
                console.log(`  ✅ All Zones - ${tripType}: ₹${price}`);
            }
        }

        console.log('\n🎉 Seeding completed successfully!');
        console.log(`✅ Created ${totalCreated} price(s)`);
        if (skippedCount > 0) {
            console.log(`⚠️  Skipped ${skippedCount} boat type(s) (no base price defined)`);
        }

        // Step 4: Display summary
        console.log('\n📊 Summary:');
        const totalPrices = await Price.countDocuments();
        const activePrices = await Price.countDocuments({ isActive: true });
        
        console.log(`   Total Prices: ${totalPrices}`);
        console.log(`   Active Prices: ${activePrices}`);
        console.log(`   All prices are Global (All Zones)`);

        // Show all prices
        console.log('\n📋 All Prices:');
        const allPrices = await Price.find({ isActive: true })
        .populate('boatTypeId', 'boatType')
        .sort({ 'boatTypeId.boatType': 1, tripType: 1 });
        
        allPrices.forEach(p => {
            console.log(`   ${p.boatTypeId.boatType} - ${p.tripType}: ₹${p.price}`);
        });

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
seedPrices();

