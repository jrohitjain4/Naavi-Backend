const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Zone = require('../models/Zone');
const Ghat = require('../models/Ghat');

// Load environment variables
dotenv.config();

// Zone-wise ghats data
const zonesData = [
  {
    zoneName: 'Zone 1',
    ghats: [
      'Assi Ghat',
      'Ganga Mahal Ghat',
      'Riva (Rewan) Ghat',
      'Tulsi Ghat',
      'Bhadaini Ghat',
      'Janaki Ghat',
      'Anandamayi (Mata Anandami) Ghat',
      'Vachcharaj Ghat',
      'Jain Ghat'
    ]
  },
  {
    zoneName: 'Zone 2',
    ghats: [
      'Nishadraj (Nishad) Ghat',
      'Prabhu Ghat',
      'Panchkota Ghat',
      'Chet Singh Ghat',
      'Niranjani Ghat',
      'Maha Nirvani Ghat'
    ]
  },
  {
    zoneName: 'Zone 3',
    ghats: [
      'Shivala Ghat',
      'Gularia Ghat',
      'Dandi Ghat',
      'Hanuman Ghat',
      'Karnataka State Ghat'
    ]
  },
  {
    zoneName: 'Zone 4',
    ghats: [
      'Harishchandra Ghat',
      'Lali Ghat',
      'Vijayanagaram Ghat'
    ]
  },
  {
    zoneName: 'Zone 5',
    ghats: [
      'Kedar Ghat',
      'Chauki (Coawki) Ghat',
      'Ksemesvara (Somesvara) Ghat',
      'Manasarovara Ghat',
      'Narada Ghat',
      'Raja Ghat',
      'Khori Ghat'
    ]
  },
  {
    zoneName: 'Zone 6',
    ghats: [
      'Pande (Pandey) Ghat',
      'Sarvesvara Ghat',
      'Digpatia Ghat',
      'Chausathi Ghat',
      'Rana Mahal Ghat',
      'Darbhanga Ghat',
      'Munsi Ghat',
      'Ahilyabai Ghat',
      'Sitala Ghat',
      'Dashashwamdh Ghat'
    ]
  },
  {
    zoneName: 'Zone 7',
    ghats: [
      'Prayag Ghat',
      'Rajendra Prasad Ghat',
      'Man Mandir Ghat',
      'Tripurabhairavi Ghat'
    ]
  },
  {
    zoneName: 'Zone 8',
    ghats: [
      'Mir Ghat',
      'Phuta (Naya) Ghat',
      'Nepali Ghat',
      'Lalita Ghat',
      'Bauli Ghat',
      'Jalashayi Ghat',
      'Khirki Ghat',
      'Manikarnika Ghat',
      'Bajirio Ghat',
      'Scindia Ghat'
    ]
  },
  {
    zoneName: 'Zone 9',
    ghats: [
      'Sankata Ghat',
      'Bhonsale Ghat',
      'Naya Ghat',
      'Ganesha Ghat',
      'Mehta Ghat'
    ]
  },
  {
    zoneName: 'Zone 10',
    ghats: [
      'RamGhat',
      'Jatara Ghat',
      'Raja Gwalior Ghat',
      'Mangala Gauri Panchganga Ghat'
    ]
  },
  {
    zoneName: 'Zone 11',
    ghats: [
      'Durga Ghat',
      'Brahama Ghat',
      'Bundi Parakota Ghat',
      'Shitala Ghat',
      'Lala Ghat',
      'Hanumangarhi Ghat',
      'Gai (Gaya) Ghat'
    ]
  },
  {
    zoneName: 'Zone 12',
    ghats: [
      'Badri Narayan Ghat',
      'Trilochan Ghat',
      'Gola Ghat',
      'Nandikeshvara (Nandu) Ghat',
      'Sakka Ghat',
      'Telianala Ghat',
      'Naya (Phuta) Ghat',
      'Prahlad Ghat'
    ]
  },
  {
    zoneName: 'Zone 13',
    ghats: [
      'Rani Ghat',
      'Raj Ghat'
    ]
  },
  {
    zoneName: 'Zone 14',
    ghats: [
      'Adi Keshava Ghat',
      'Namo Ghat'
    ]
  },
  {
    zoneName: 'Zone 15',
    ghats: [
      'Sant Ravidas Ghat'
    ]
  }
];

// Helper function to generate Ghat ID
const generateGhatId = async () => {
  try {
    const lastGhat = await Ghat.findOne().sort({ ghatId: -1 });
    
    if (!lastGhat || !lastGhat.ghatId) {
      return 'GHAT-001';
    }
    
    const lastNumber = parseInt(lastGhat.ghatId.split('-')[1]) || 0;
    const nextNumber = lastNumber + 1;
    
    return `GHAT-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating ghat ID:', error);
    return `GHAT-${Date.now().toString().slice(-3)}`;
  }
};

async function populateGhats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Delete all existing ghats
    await Ghat.deleteMany({});
    console.log('🗑️  Deleted all existing ghats');

    let ghatCounter = 0;

    // Create ghats for each zone
    for (const zoneData of zonesData) {
      // Find zone by name
      const zone = await Zone.findOne({ zoneName: zoneData.zoneName });
      
      if (!zone) {
        console.log(`⚠️  Zone "${zoneData.zoneName}" not found, skipping...`);
        continue;
      }

      // Create ghats for this zone
      for (const ghatName of zoneData.ghats) {
        // Check if ghat already exists
        const existingGhat = await Ghat.findOne({ 
          ghatName: ghatName.trim(),
          zoneId: zone._id 
        });
        
        if (existingGhat) {
          console.log(`⚠️  Ghat "${ghatName}" already exists in ${zoneData.zoneName}, skipping...`);
          continue;
        }

        const ghatId = await generateGhatId();
        
        const ghat = new Ghat({
          ghatId,
          ghatName: ghatName.trim(),
          zoneId: zone._id,
          zoneName: zone.zoneName,
          status: 'Active',
        });

        await ghat.save();
        ghatCounter++;
        console.log(`✅ Created ${ghatId}: ${ghatName} in ${zoneData.zoneName}`);
      }
    }

    console.log(`\n🎉 Successfully populated ${ghatCounter} ghats!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating ghats:', error);
    process.exit(1);
  }
}

// Run the script
populateGhats();

