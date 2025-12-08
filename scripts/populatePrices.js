const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Price = require('../models/Price');
const BoatType = require('../models/BoatType');
const Zone = require('../models/Zone');

dotenv.config();

// Base prices for Full Trip
const fullTripPrices = {
  'Motor Boat Small': 1000,
  'Motor Boat Medium': 2000,
  'Motor Boat Large': 3000,
  'Motor Boat Extra Large': 4000,
};

// Trip types
const tripTypes = ['Full Trip', 'Half Trip', 'Cross Trip'];

async function populatePrices() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all boat types
    const boatTypes = await BoatType.find();
    if (boatTypes.length === 0) {
      console.log('❌ No boat types found. Please run populateBoatTypes.js first.');
      process.exit(1);
    }

    // Get all zones
    const zones = await Zone.find();
    console.log(`📋 Found ${zones.length} zones`);

    let priceCounter = 0;
    let updateCounter = 0;

    // Create prices for each boat type, trip type, and zone
    for (const boatType of boatTypes) {
      const basePrice = fullTripPrices[boatType.boatType];
      
      if (!basePrice) {
        console.log(`⚠️  No base price defined for ${boatType.boatType}, skipping...`);
        continue;
      }

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

        // Create price for each zone
        for (const zone of zones) {
          // Check if price already exists
          const existingPrice = await Price.findOne({
            boatTypeId: boatType._id,
            zoneId: zone._id,
            tripType: tripType,
          });

          if (existingPrice) {
            // Update existing price
            existingPrice.price = price;
            existingPrice.isActive = true;
            await existingPrice.save();
            updateCounter++;
            console.log(`✅ Updated: ${boatType.boatType} - ${zone.zoneName} - ${tripType} = ₹${price}`);
          } else {
            // Create new price
            const newPrice = new Price({
              boatTypeId: boatType._id,
              zoneId: zone._id,
              tripType: tripType,
              price: price,
              isActive: true,
            });

            await newPrice.save();
            priceCounter++;
            console.log(`✅ Created: ${boatType.boatType} - ${zone.zoneName} - ${tripType} = ₹${price}`);
          }
        }

        // Also create a global price (zoneId = null) for each boat type and trip type
        const existingGlobalPrice = await Price.findOne({
          boatTypeId: boatType._id,
          zoneId: null,
          tripType: tripType,
        });

        if (existingGlobalPrice) {
          existingGlobalPrice.price = price;
          existingGlobalPrice.isActive = true;
          await existingGlobalPrice.save();
          updateCounter++;
          console.log(`✅ Updated Global: ${boatType.boatType} - All Zones - ${tripType} = ₹${price}`);
        } else {
          const globalPrice = new Price({
            boatTypeId: boatType._id,
            zoneId: null,
            tripType: tripType,
            price: price,
            isActive: true,
          });

          await globalPrice.save();
          priceCounter++;
          console.log(`✅ Created Global: ${boatType.boatType} - All Zones - ${tripType} = ₹${price}`);
        }
      }
    }

    console.log(`\n🎉 Successfully created ${priceCounter} new prices and updated ${updateCounter} existing prices!`);
    
    // Display summary
    const totalPrices = await Price.countDocuments();
    const activePrices = await Price.countDocuments({ isActive: true });
    console.log(`\n📊 Price Summary:`);
    console.log(`   Total Prices: ${totalPrices}`);
    console.log(`   Active Prices: ${activePrices}`);
    
    // Show sample prices
    console.log(`\n📋 Sample Prices (Full Trip):`);
    const samplePrices = await Price.find({ 
      tripType: 'Full Trip',
      isActive: true 
    })
    .populate('boatTypeId', 'boatType')
    .populate('zoneId', 'zoneName')
    .limit(5)
    .sort({ createdAt: -1 });
    
    samplePrices.forEach(p => {
      const zoneName = p.zoneId ? p.zoneId.zoneName : 'All Zones';
      console.log(`   ${p.boatTypeId.boatType} - ${zoneName}: ₹${p.price}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating prices:', error);
    process.exit(1);
  }
}

populatePrices();

