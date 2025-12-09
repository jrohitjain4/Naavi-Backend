const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Zone = require('../models/Zone');
const Ghat = require('../models/Ghat');
const Boat = require('../models/Boat');

dotenv.config();

// Helper function to generate Zone ID
const generateZoneId = async () => {
    try {
        const lastZone = await Zone.findOne({ zoneId: { $exists: true, $ne: null } })
            .sort({ zoneId: -1 });
        
        if (!lastZone || !lastZone.zoneId) {
            return 'ZONE-001';
        }
        
        const lastNumber = parseInt(lastZone.zoneId.split('-')[1]) || 0;
        const nextNumber = lastNumber + 1;
        
        return `ZONE-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating zone ID:', error);
        return `ZONE-${Date.now().toString().slice(-3)}`;
    }
};

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

// Helper function to sync ghats from Zone to Ghat model (same as zoneController)
const syncGhatsToModel = async (zone, ghatsArray) => {
    if (!ghatsArray || !Array.isArray(ghatsArray)) {
        return [];
    }

    const ghatIds = [];
    
    // Get existing ghats for this zone
    const existingGhats = await Ghat.find({ zoneId: zone._id });
    const existingGhatNames = new Set(existingGhats.map(g => g.ghatName.toLowerCase()));
    
    // Process each ghat name
    for (const ghatItem of ghatsArray) {
        const ghatName = typeof ghatItem === 'string' ? ghatItem : (ghatItem.name || ghatItem.ghatName);
        
        if (!ghatName || !ghatName.trim()) {
            continue;
        }
        
        const trimmedName = ghatName.trim();
        const ghatNameLower = trimmedName.toLowerCase();
        
        // Check if ghat already exists
        let existingGhat = existingGhats.find(g => g.ghatName.toLowerCase() === ghatNameLower);
        
        if (!existingGhat) {
            // Create new ghat
            const ghatId = await generateGhatId();
            const newGhat = new Ghat({
                ghatId,
                ghatName: trimmedName,
                zoneId: zone._id,
                zoneName: zone.zoneName,
                status: 'Active',
                boardingPoints: zone.boardingPoints || [],
            });
            
            await newGhat.save();
            ghatIds.push(ghatId);
            console.log(`  ✅ Created ${ghatId}: ${trimmedName}`);
        } else {
            // Use existing ghat
            ghatIds.push(existingGhat.ghatId);
            console.log(`  ✓ Using existing ${existingGhat.ghatId}: ${trimmedName}`);
        }
    }
    
    // Delete ghats that are no longer in the zone's ghats array
    const currentGhatNames = new Set(ghatsArray.map(g => {
        const name = typeof g === 'string' ? g : (g.name || g.ghatName);
        return name ? name.trim().toLowerCase() : '';
    }).filter(n => n));
    
    for (const existingGhat of existingGhats) {
        if (!currentGhatNames.has(existingGhat.ghatName.toLowerCase())) {
            // Ghat was removed from zone, delete it
            await Ghat.findByIdAndDelete(existingGhat._id);
            console.log(`  🗑️  Deleted ${existingGhat.ghatId}: ${existingGhat.ghatName} (removed from zone)`);
        }
    }
    
    return ghatIds;
};

// Complete zones data with ghats and boarding points
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
            'Jain Ghat',
        ],
        boardingPoints: ['Assi Ghat'],
    },
    {
        zoneName: 'Zone 2',
        ghats: [
            'Nishadraj (Nishad) Ghat',
            'Prabhu Ghat',
            'Panchkota Ghat',
            'Chet Singh Ghat',
            'Niranjani Ghat',
            'Maha Nirvani Ghat',
        ],
        boardingPoints: ['Nishadraj (Nishad) Ghat'],
    },
    {
        zoneName: 'Zone 3',
        ghats: [
            'Shivala Ghat',
            'Gularia Ghat',
            'Dandi Ghat',
            'Hanuman Ghat',
            'Karnataka State Ghat',
        ],
        boardingPoints: ['Shivala Ghat'],
    },
    {
        zoneName: 'Zone 4',
        ghats: [
            'Harishchandra Ghat',
            'Lali Ghat',
            'Vijayanagaram Ghat',
        ],
        boardingPoints: ['Harishchandra Ghat'],
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
            'Khori Ghat',
        ],
        boardingPoints: ['Kedar Ghat'],
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
        ],
        boardingPoints: ['Pande (Pandey) Ghat'],
    },
    {
        zoneName: 'Zone 7',
        ghats: [
            'Dashashwamdh Ghat',
            'Prayag Ghat',
            'Rajendra Prasad Ghat',
            'Man Mandir Ghat',
            'Tripurabhairavi Ghat',
        ],
        boardingPoints: ['Dashashwamdh Ghat'],
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
        ],
        boardingPoints: ['Mir Ghat'],
    },
    {
        zoneName: 'Zone 9',
        ghats: [
            'Scindia Ghat',
            'Sankata Ghat',
            'Bhonsale Ghat',
            'Naya Ghat',
            'Ganesha Ghat',
        ],
        boardingPoints: ['Scindia Ghat'],
    },
    {
        zoneName: 'Zone 10',
        ghats: [
            'Mehta Ghat',
            'RamGhat',
            'Jatara Ghat',
            'Raja Gwalior Ghat',
        ],
        boardingPoints: ['Mehta Ghat'],
    },
    {
        zoneName: 'Zone 11',
        ghats: [
            'Mangala Gauri Panchganga Ghat',
            'Durga Ghat',
            'Brahama Ghat',
            'Bundi Parakota Ghat',
            'Shitala Ghat',
            'Lala Ghat',
            'Hanumangarhi Ghat',
        ],
        boardingPoints: ['Mangala Gauri Panchganga Ghat'],
    },
    {
        zoneName: 'Zone 12',
        ghats: [
            'Gai (Gaya) Ghat',
            'Badri Narayan Ghat',
            'Trilochan Ghat',
            'Gola Ghat',
            'Nandikeshvara (Nandu) Ghat',
            'Sakka Ghat',
            'Telianala Ghat',
            'Naya (Phuta) Ghat',
        ],
        boardingPoints: ['Gai (Gaya) Ghat'],
    },
    {
        zoneName: 'Zone 13',
        ghats: [
            'Prahlad Ghat',
            'Rani Ghat',
            'Raj Ghat',
        ],
        boardingPoints: ['Prahlad Ghat'],
    },
    {
        zoneName: 'Zone 14',
        ghats: [
            'Namo Ghat',
            'Adi Keshava Ghat',
        ],
        boardingPoints: ['Namo Ghat'],
    },
    {
        zoneName: 'Zone 15',
        ghats: [
            'Sant Ravidas Ghat',
        ],
        boardingPoints: ['Sant Ravidas Ghat'],
    },
];

async function seedZonesAndGhats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Delete all existing zones and ghats
        console.log('🗑️  Step 1: Deleting existing zones and ghats...');
        
        // Check if zones have boats assigned
        const zonesWithBoats = await Zone.find({});
        for (const zone of zonesWithBoats) {
            const boatsCount = await Boat.countDocuments({ zoneId: zone._id });
            if (boatsCount > 0) {
                console.log(`⚠️  Warning: Zone ${zone.zoneId} has ${boatsCount} boat(s) assigned. Boats will remain but zone will be deleted.`);
            }
        }
        
        // Delete all ghats first (to avoid foreign key issues)
        const deletedGhats = await Ghat.deleteMany({});
        console.log(`✅ Deleted ${deletedGhats.deletedCount} ghat(s)`);
        
        // Delete all zones
        const deletedZones = await Zone.deleteMany({});
        console.log(`✅ Deleted ${deletedZones.deletedCount} zone(s)\n`);

        // Step 2: Create zones with ghats using new flow
        console.log('📝 Step 2: Creating zones with ghats (new flow)...\n');
        
        let totalGhatsCreated = 0;
        
        for (const zoneData of zonesData) {
            // Generate zone ID
            const zoneId = await generateZoneId();
            
            // Create zone first
            const newZone = new Zone({
                zoneId,
                zoneName: zoneData.zoneName,
                ghats: [], // Will be populated after ghats are created
                totalGhats: 0,
                boats: 0,
                status: 'Active',
                boardingPoints: zoneData.boardingPoints || [],
            });
            
            await newZone.save();
            console.log(`✅ Created zone: ${zoneId} - ${zoneData.zoneName}`);
            console.log(`   Boarding Points: ${zoneData.boardingPoints.join(', ')}`);
            
            // Now sync ghats - create Ghat entries and get ghatIds
            if (zoneData.ghats && zoneData.ghats.length > 0) {
                console.log(`   Creating ${zoneData.ghats.length} ghat(s)...`);
                const ghatIds = await syncGhatsToModel(newZone, zoneData.ghats);
                totalGhatsCreated += ghatIds.length;
                
                // Update zone with ghatIds
                newZone.ghats = ghatIds.map(ghatId => ({ ghatId }));
                newZone.totalGhats = ghatIds.length;
                await newZone.save();
                
                console.log(`   ✓ Zone updated with ${ghatIds.length} ghat(s)\n`);
            } else {
                console.log(`   ⚠️  No ghats for this zone\n`);
            }
        }

        console.log('\n🎉 Seeding completed successfully!');
        console.log(`✅ Created ${zonesData.length} zone(s)`);
        console.log(`✅ Created ${totalGhatsCreated} ghat(s) in Ghat model`);
        console.log(`✅ All zones have boarding points configured`);
        console.log('\n📊 Summary:');
        
        // Show summary
        const allZones = await Zone.find().sort({ zoneId: 1 });
        for (const zone of allZones) {
            const ghats = await Ghat.find({ zoneId: zone._id });
            console.log(`   ${zone.zoneId} - ${zone.zoneName}: ${ghats.length} ghat(s), ${zone.boardingPoints.length} boarding point(s)`);
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
seedZonesAndGhats();

