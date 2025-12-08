const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Price = require('../models/Price');

dotenv.config();

async function deleteAllPrices() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Count prices before deletion
    const countBefore = await Price.countDocuments();
    console.log(`📊 Found ${countBefore} prices in database`);

    if (countBefore === 0) {
      console.log('ℹ️  No prices to delete.');
      process.exit(0);
    }

    // Delete all prices
    const result = await Price.deleteMany({});
    
    console.log(`\n🗑️  Deleted ${result.deletedCount} prices from database`);
    console.log('✅ All prices deleted successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting prices:', error);
    process.exit(1);
  }
}

deleteAllPrices();

