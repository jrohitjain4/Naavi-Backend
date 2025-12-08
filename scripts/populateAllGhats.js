const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Zone = require('../models/Zone');
const Ghat = require('../models/Ghat');

dotenv.config();

// Complete ghats data from user
const ghatsData = [
  // Zone 1
  { name: 'Assi Ghat', zone: 'ZONE-001' },
  { name: 'Ganga Mahal Ghat', zone: 'ZONE-001' },
  { name: 'Riva (Rewan) Ghat', zone: 'ZONE-001' },
  { name: 'Tulsi Ghat', zone: 'ZONE-001' },
  { name: 'Bhadaini Ghat', zone: 'ZONE-001' },
  { name: 'Janaki Ghat', zone: 'ZONE-001' },
  { name: 'Anandamayi (Mata Anandami) Ghat', zone: 'ZONE-001' },
  { name: 'Vachcharaj Ghat', zone: 'ZONE-001' },
  { name: 'Jain Ghat', zone: 'ZONE-001' },
  
  // Zone 2
  { name: 'Nishadraj (Nishad) Ghat', zone: 'ZONE-002' },
  { name: 'Prabhu Ghat', zone: 'ZONE-002' },
  { name: 'Panchkota Ghat', zone: 'ZONE-002' },
  { name: 'Chet Singh Ghat', zone: 'ZONE-002' },
  { name: 'Niranjani Ghat', zone: 'ZONE-002' },
  { name: 'Maha Nirvani Ghat', zone: 'ZONE-002' },
  
  // Zone 3
  { name: 'Shivala Ghat', zone: 'ZONE-003' },
  { name: 'Gularia Ghat', zone: 'ZONE-003' },
  { name: 'Dandi Ghat', zone: 'ZONE-003' },
  { name: 'Hanuman Ghat', zone: 'ZONE-003' },
  { name: 'Karnataka State Ghat', zone: 'ZONE-003' },
  
  // Zone 4
  { name: 'Harishchandra Ghat', zone: 'ZONE-004' },
  { name: 'Lali Ghat', zone: 'ZONE-004' },
  { name: 'Vijayanagaram Ghat', zone: 'ZONE-004' },
  
  // Zone 5
  { name: 'Kedar Ghat', zone: 'ZONE-005' },
  { name: 'Chauki (Coawki) Ghat', zone: 'ZONE-005' },
  { name: 'Ksemesvara (Somesvara) Ghat', zone: 'ZONE-005' },
  { name: 'Manasarovara Ghat', zone: 'ZONE-005' },
  { name: 'Narada Ghat', zone: 'ZONE-005' },
  { name: 'Raja Ghat', zone: 'ZONE-005' },
  { name: 'Khori Ghat', zone: 'ZONE-005' },
  
  // Zone 6
  { name: 'Pande (Pandey) Ghat', zone: 'ZONE-006' },
  { name: 'Sarvesvara Ghat', zone: 'ZONE-006' },
  { name: 'Digpatia Ghat', zone: 'ZONE-006' },
  { name: 'Chausathi Ghat', zone: 'ZONE-006' },
  { name: 'Rana Mahal Ghat', zone: 'ZONE-006' },
  { name: 'Darbhanga Ghat', zone: 'ZONE-006' },
  { name: 'Munsi Ghat', zone: 'ZONE-006' },
  { name: 'Ahilyabai Ghat', zone: 'ZONE-006' },
  { name: 'Sitala Ghat', zone: 'ZONE-006' },
  
  // Zone 7
  { name: 'Dashashwamdh Ghat', zone: 'ZONE-007' },
  { name: 'Prayag Ghat', zone: 'ZONE-007' },
  { name: 'Rajendra Prasad Ghat', zone: 'ZONE-007' },
  { name: 'Man Mandir Ghat', zone: 'ZONE-007' },
  { name: 'Tripurabhairavi Ghat', zone: 'ZONE-007' },
  
  // Zone 8
  { name: 'Mir Ghat', zone: 'ZONE-008' },
  { name: 'Phuta (Naya) Ghat', zone: 'ZONE-008' },
  { name: 'Nepali Ghat', zone: 'ZONE-008' },
  { name: 'Lalita Ghat', zone: 'ZONE-008' },
  { name: 'Bauli Ghat', zone: 'ZONE-008' },
  { name: 'Jalashayi Ghat', zone: 'ZONE-008' },
  { name: 'Khirki Ghat', zone: 'ZONE-008' },
  { name: 'Manikarnika Ghat', zone: 'ZONE-008' },
  { name: 'Bajirio Ghat', zone: 'ZONE-008' },
  
  // Zone 9
  { name: 'Scindia Ghat', zone: 'ZONE-009' },
  { name: 'Sankata Ghat', zone: 'ZONE-009' },
  { name: 'Bhonsale Ghat', zone: 'ZONE-009' },
  { name: 'Naya Ghat', zone: 'ZONE-009' },
  { name: 'Ganesha Ghat', zone: 'ZONE-009' },
  
  // Zone 10
  { name: 'Mehta Ghat', zone: 'ZONE-010' },
  { name: 'RamGhat', zone: 'ZONE-010' },
  { name: 'Jatara Ghat', zone: 'ZONE-010' },
  { name: 'Raja Gwalior Ghat', zone: 'ZONE-010' },
  
  // Zone 11
  { name: 'Mangala Gauri Panchganga Ghat', zone: 'ZONE-011' },
  { name: 'Durga Ghat', zone: 'ZONE-011' },
  { name: 'Brahama Ghat', zone: 'ZONE-011' },
  { name: 'Bundi Parakota Ghat', zone: 'ZONE-011' },
  { name: 'Shitala Ghat', zone: 'ZONE-011' },
  { name: 'Lala Ghat', zone: 'ZONE-011' },
  { name: 'Hanumangarhi Ghat', zone: 'ZONE-011' },
  
  // Zone 12
  { name: 'Gai (Gaya) Ghat', zone: 'ZONE-012' },
  { name: 'Badri Narayan Ghat', zone: 'ZONE-012' },
  { name: 'Trilochan Ghat', zone: 'ZONE-012' },
  { name: 'Gola Ghat', zone: 'ZONE-012' },
  { name: 'Nandikeshvara (Nandu) Ghat', zone: 'ZONE-012' },
  { name: 'Sakka Ghat', zone: 'ZONE-012' },
  { name: 'Telianala Ghat', zone: 'ZONE-012' },
  { name: 'Naya (Phuta) Ghat', zone: 'ZONE-012' },
  
  // Zone 13
  { name: 'Prahlad Ghat', zone: 'ZONE-013' },
  { name: 'Rani Ghat', zone: 'ZONE-013' },
  { name: 'Raj Ghat', zone: 'ZONE-013' },
  
  // Zone 14
  { name: 'Namo Ghat', zone: 'ZONE-014' },
  { name: 'Adi Keshava Ghat', zone: 'ZONE-014' },
  
  // Zone 15
  { name: 'Sant Ravidas Ghat', zone: 'ZONE-015' },
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

async function populateAllGhats() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all existing ghats
    await Ghat.deleteMany({});
    console.log('🗑️  Deleted all existing ghats');

    let ghatCounter = 0;
    let ghatIdCounter = 1;

    // Group ghats by zone
    const ghatsByZone = {};
    ghatsData.forEach(ghat => {
      if (!ghatsByZone[ghat.zone]) {
        ghatsByZone[ghat.zone] = [];
      }
      ghatsByZone[ghat.zone].push(ghat.name);
    });

    // First, let's check what zones exist
    const allZones = await Zone.find().sort({ zoneId: 1 });
    console.log(`\n📋 Found ${allZones.length} zones in database:`);
    allZones.forEach(z => console.log(`   ${z.zoneId} - ${z.zoneName}`));

    // Create ghats for each zone
    for (const [zoneId, ghatNames] of Object.entries(ghatsByZone)) {
      // Try to find zone by zoneId
      let zone = await Zone.findOne({ zoneId: zoneId });
      
      // If not found, try to find by zoneName (e.g., "Zone 1" for "ZONE-001")
      if (!zone) {
        const zoneNumber = zoneId.replace('ZONE-', '').replace(/^0+/, '');
        const zoneName = `Zone ${zoneNumber}`;
        zone = await Zone.findOne({ zoneName: zoneName });
      }
      
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

    // Update boarding points for zones
    console.log('\n📝 Updating boarding points for zones...');
    for (const [zoneId, boardingPoints] of Object.entries(boardingPointsMap)) {
      const zone = await Zone.findOne({ zoneId: zoneId });
      if (zone) {
        zone.boardingPoints = boardingPoints;
        await zone.save();
        console.log(`✅ Updated ${zone.zoneName} (${zoneId}) with boarding points: ${boardingPoints.join(', ')}`);
      }
    }

    console.log(`\n🎉 Successfully populated ${ghatCounter} ghats and updated boarding points!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating ghats:', error);
    process.exit(1);
  }
}

populateAllGhats();

