const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Zone = require('../models/Zone');
const Ghat = require('../models/Ghat');

dotenv.config();

// Complete zones data
const zonesData = [
  { zoneId: 'ZONE-001', zoneName: 'Zone 1' },
  { zoneId: 'ZONE-002', zoneName: 'Zone 2' },
  { zoneId: 'ZONE-003', zoneName: 'Zone 3' },
  { zoneId: 'ZONE-004', zoneName: 'Zone 4' },
  { zoneId: 'ZONE-005', zoneName: 'Zone 5' },
  { zoneId: 'ZONE-006', zoneName: 'Zone 6' },
  { zoneId: 'ZONE-007', zoneName: 'Zone 7' },
  { zoneId: 'ZONE-008', zoneName: 'Zone 8' },
  { zoneId: 'ZONE-009', zoneName: 'Zone 9' },
  { zoneId: 'ZONE-010', zoneName: 'Zone 10' },
  { zoneId: 'ZONE-011', zoneName: 'Zone 11' },
  { zoneId: 'ZONE-012', zoneName: 'Zone 12' },
  { zoneId: 'ZONE-013', zoneName: 'Zone 13' },
  { zoneId: 'ZONE-014', zoneName: 'Zone 14' },
  { zoneId: 'ZONE-015', zoneName: 'Zone 15' },
];

// Complete ghats data from user
const ghatsData = [
  // Zone 1
  { name: 'Assi Ghat', zoneId: 'ZONE-001' },
  { name: 'Ganga Mahal Ghat', zoneId: 'ZONE-001' },
  { name: 'Riva (Rewan) Ghat', zoneId: 'ZONE-001' },
  { name: 'Tulsi Ghat', zoneId: 'ZONE-001' },
  { name: 'Bhadaini Ghat', zoneId: 'ZONE-001' },
  { name: 'Janaki Ghat', zoneId: 'ZONE-001' },
  { name: 'Anandamayi (Mata Anandami) Ghat', zoneId: 'ZONE-001' },
  { name: 'Vachcharaj Ghat', zoneId: 'ZONE-001' },
  { name: 'Jain Ghat', zoneId: 'ZONE-001' },
  
  // Zone 2
  { name: 'Nishadraj (Nishad) Ghat', zoneId: 'ZONE-002' },
  { name: 'Prabhu Ghat', zoneId: 'ZONE-002' },
  { name: 'Panchkota Ghat', zoneId: 'ZONE-002' },
  { name: 'Chet Singh Ghat', zoneId: 'ZONE-002' },
  { name: 'Niranjani Ghat', zoneId: 'ZONE-002' },
  { name: 'Maha Nirvani Ghat', zoneId: 'ZONE-002' },
  
  // Zone 3
  { name: 'Shivala Ghat', zoneId: 'ZONE-003' },
  { name: 'Gularia Ghat', zoneId: 'ZONE-003' },
  { name: 'Dandi Ghat', zoneId: 'ZONE-003' },
  { name: 'Hanuman Ghat', zoneId: 'ZONE-003' },
  { name: 'Karnataka State Ghat', zoneId: 'ZONE-003' },
  
  // Zone 4
  { name: 'Harishchandra Ghat', zoneId: 'ZONE-004' },
  { name: 'Lali Ghat', zoneId: 'ZONE-004' },
  { name: 'Vijayanagaram Ghat', zoneId: 'ZONE-004' },
  
  // Zone 5
  { name: 'Kedar Ghat', zoneId: 'ZONE-005' },
  { name: 'Chauki (Coawki) Ghat', zoneId: 'ZONE-005' },
  { name: 'Ksemesvara (Somesvara) Ghat', zoneId: 'ZONE-005' },
  { name: 'Manasarovara Ghat', zoneId: 'ZONE-005' },
  { name: 'Narada Ghat', zoneId: 'ZONE-005' },
  { name: 'Raja Ghat', zoneId: 'ZONE-005' },
  { name: 'Khori Ghat', zoneId: 'ZONE-005' },
  
  // Zone 6
  { name: 'Pande (Pandey) Ghat', zoneId: 'ZONE-006' },
  { name: 'Sarvesvara Ghat', zoneId: 'ZONE-006' },
  { name: 'Digpatia Ghat', zoneId: 'ZONE-006' },
  { name: 'Chausathi Ghat', zoneId: 'ZONE-006' },
  { name: 'Rana Mahal Ghat', zoneId: 'ZONE-006' },
  { name: 'Darbhanga Ghat', zoneId: 'ZONE-006' },
  { name: 'Munsi Ghat', zoneId: 'ZONE-006' },
  { name: 'Ahilyabai Ghat', zoneId: 'ZONE-006' },
  { name: 'Sitala Ghat', zoneId: 'ZONE-006' },
  
  // Zone 7
  { name: 'Dashashwamdh Ghat', zoneId: 'ZONE-007' },
  { name: 'Prayag Ghat', zoneId: 'ZONE-007' },
  { name: 'Rajendra Prasad Ghat', zoneId: 'ZONE-007' },
  { name: 'Man Mandir Ghat', zoneId: 'ZONE-007' },
  { name: 'Tripurabhairavi Ghat', zoneId: 'ZONE-007' },
  
  // Zone 8
  { name: 'Mir Ghat', zoneId: 'ZONE-008' },
  { name: 'Phuta (Naya) Ghat', zoneId: 'ZONE-008' },
  { name: 'Nepali Ghat', zoneId: 'ZONE-008' },
  { name: 'Lalita Ghat', zoneId: 'ZONE-008' },
  { name: 'Bauli Ghat', zoneId: 'ZONE-008' },
  { name: 'Jalashayi Ghat', zoneId: 'ZONE-008' },
  { name: 'Khirki Ghat', zoneId: 'ZONE-008' },
  { name: 'Manikarnika Ghat', zoneId: 'ZONE-008' },
  { name: 'Bajirio Ghat', zoneId: 'ZONE-008' },
  
  // Zone 9
  { name: 'Scindia Ghat', zoneId: 'ZONE-009' },
  { name: 'Sankata Ghat', zoneId: 'ZONE-009' },
  { name: 'Bhonsale Ghat', zoneId: 'ZONE-009' },
  { name: 'Naya Ghat', zoneId: 'ZONE-009' },
  { name: 'Ganesha Ghat', zoneId: 'ZONE-009' },
  
  // Zone 10
  { name: 'Mehta Ghat', zoneId: 'ZONE-010' },
  { name: 'RamGhat', zoneId: 'ZONE-010' },
  { name: 'Jatara Ghat', zoneId: 'ZONE-010' },
  { name: 'Raja Gwalior Ghat', zoneId: 'ZONE-010' },
  
  // Zone 11
  { name: 'Mangala Gauri Panchganga Ghat', zoneId: 'ZONE-011' },
  { name: 'Durga Ghat', zoneId: 'ZONE-011' },
  { name: 'Brahama Ghat', zoneId: 'ZONE-011' },
  { name: 'Bundi Parakota Ghat', zoneId: 'ZONE-011' },
  { name: 'Shitala Ghat', zoneId: 'ZONE-011' },
  { name: 'Lala Ghat', zoneId: 'ZONE-011' },
  { name: 'Hanumangarhi Ghat', zoneId: 'ZONE-011' },
  
  // Zone 12
  { name: 'Gai (Gaya) Ghat', zoneId: 'ZONE-012' },
  { name: 'Badri Narayan Ghat', zoneId: 'ZONE-012' },
  { name: 'Trilochan Ghat', zoneId: 'ZONE-012' },
  { name: 'Gola Ghat', zoneId: 'ZONE-012' },
  { name: 'Nandikeshvara (Nandu) Ghat', zoneId: 'ZONE-012' },
  { name: 'Sakka Ghat', zoneId: 'ZONE-012' },
  { name: 'Telianala Ghat', zoneId: 'ZONE-012' },
  { name: 'Naya (Phuta) Ghat', zoneId: 'ZONE-012' },
  
  // Zone 13
  { name: 'Prahlad Ghat', zoneId: 'ZONE-013' },
  { name: 'Rani Ghat', zoneId: 'ZONE-013' },
  { name: 'Raj Ghat', zoneId: 'ZONE-013' },
  
  // Zone 14
  { name: 'Namo Ghat', zoneId: 'ZONE-014' },
  { name: 'Adi Keshava Ghat', zoneId: 'ZONE-014' },
  
  // Zone 15
  { name: 'Sant Ravidas Ghat', zoneId: 'ZONE-015' },
];

// Boarding points for each zone
const boardingPointsMap = {
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

async function populateZonesAndGhats() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Create zones if they don't exist
    console.log('\n📝 Step 1: Creating/Updating zones...');
    for (const zoneData of zonesData) {
      let zone = await Zone.findOne({ zoneId: zoneData.zoneId });
      
      if (!zone) {
        zone = new Zone({
          zoneId: zoneData.zoneId,
          zoneName: zoneData.zoneName,
          ghats: [],
          totalGhats: 0,
          boats: 0,
          status: 'Active',
          boardingPoints: boardingPointsMap[zoneData.zoneId] || [],
        });
        await zone.save();
        console.log(`✅ Created zone: ${zoneData.zoneId} - ${zoneData.zoneName}`);
      } else {
        // Update boarding points if zone exists
        zone.boardingPoints = boardingPointsMap[zoneData.zoneId] || [];
        await zone.save();
        console.log(`✅ Updated zone: ${zoneData.zoneId} - ${zoneData.zoneName} (boarding points updated)`);
      }
    }

    // Step 2: Delete all existing ghats
    console.log('\n🗑️  Step 2: Deleting existing ghats...');
    await Ghat.deleteMany({});
    console.log('✅ Deleted all existing ghats');

    // Step 3: Create ghats
    console.log('\n📝 Step 3: Creating ghats...');
    let ghatCounter = 0;
    let ghatIdCounter = 1;

    // Group ghats by zone
    const ghatsByZone = {};
    ghatsData.forEach(ghat => {
      if (!ghatsByZone[ghat.zoneId]) {
        ghatsByZone[ghat.zoneId] = [];
      }
      ghatsByZone[ghat.zoneId].push(ghat.name);
    });

    // Create ghats for each zone
    for (const [zoneId, ghatNames] of Object.entries(ghatsByZone)) {
      const zone = await Zone.findOne({ zoneId: zoneId });
      
      if (!zone) {
        console.log(`⚠️  Zone "${zoneId}" not found, skipping...`);
        continue;
      }

      // Create ghats for this zone
      for (const ghatName of ghatNames) {
        const ghatId = `GHAT-${String(ghatIdCounter).padStart(3, '0')}`;
        ghatIdCounter++;

        const ghat = new Ghat({
          ghatId,
          ghatName: ghatName.trim(),
          zoneId: zone._id,
          zoneName: zone.zoneName,
          status: 'Active',
        });

        await ghat.save();
        ghatCounter++;
        console.log(`✅ Created ${ghatId}: ${ghatName} in ${zone.zoneName}`);
      }
    }

    console.log(`\n🎉 Successfully populated ${ghatCounter} ghats!`);
    console.log(`✅ All zones created/updated with boarding points!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateZonesAndGhats();

