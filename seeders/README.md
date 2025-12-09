# Seeders

This folder contains database seeders for populating initial data.

## Available Seeders

### `seedZonesAndGhats.js`
Seeds zones and ghats with the new flow where:
- Zones are created with ghat names
- Ghats are automatically created in the Ghat model
- Zone's `ghats` array stores `ghatId` references
- Boarding points are included for each zone

### `seedBoatTypes.js`
Seeds boat types with:
- Auto-generated boat IDs (BOAT-001, BOAT-002, etc.)
- Boat type names and capacities
- Initial numberOfBoats count (0 by default)

### `seedPrices.js`
Seeds prices for:
- Global prices only (zoneId = null) for each boat type and trip type
- 4 boat types × 3 trip types = 12 total prices
- Price calculation: Full Trip = base, Half Trip = base/2, Cross Trip = base*2

## Usage

### Run Zone and Ghat Seeder

```bash
cd Navi-backend
npm run seed:zones
```

Or directly:
```bash
node seeders/seedZonesAndGhats.js
```

### Run Boat Types Seeder

```bash
cd Navi-backend
npm run seed:boatTypes
```

Or directly:
```bash
node seeders/seedBoatTypes.js
```

### Run Prices Seeder

```bash
cd Navi-backend
npm run seed:prices
```

Or directly:
```bash
node seeders/seedPrices.js
```

**Note:** Prices seeder requires boat types and zones to be seeded first!

## What Each Seeder Does:

### `seedZonesAndGhats.js`:
1. **Deletes all existing zones and ghats** (be careful if you have production data!)
2. **Creates 15 zones** with proper zone IDs (ZONE-001 to ZONE-015)
3. **Creates ghats automatically** when zones are created (using the new flow)
4. **Stores ghatIds** in Zone's ghats array (not just names)
5. **Sets boarding points** for each zone

### `seedBoatTypes.js`:
1. **Deletes all existing boat types** (be careful if you have production data!)
2. **Creates 4 boat types** with proper boat IDs (BOAT-001 to BOAT-004)
3. **Sets capacity** for each boat type
4. **Initializes numberOfBoats** to 0 (will be updated when actual boats are registered)

### `seedPrices.js`:
1. **Deletes all existing prices** (be careful if you have production data!)
2. **Creates only global prices** (zoneId = null) for:
   - 4 Boat Types × 3 Trip Types = 12 prices
3. **Calculates prices** based on trip type:
   - Full Trip = Base Price
   - Half Trip = Base Price / 2
   - Cross Trip = Base Price × 2
4. **All prices apply to all zones** (global pricing)

## Data Structure

### Zones:
- `zoneId`: Auto-generated (ZONE-001, ZONE-002, etc.)
- `zoneName`: Zone name
- `ghats`: Array of ghat names (will be converted to ghatIds)
- `boardingPoints`: Array of boarding point names
- `status`: 'Active' by default

### Boat Types:
- `boatId`: Auto-generated (BOAT-001, BOAT-002, etc.)
- `boatType`: Boat type name (e.g., "Motor Boat Small")
- `capacity`: Maximum passenger capacity
- `numberOfBoats`: Count of actual boats of this type (starts at 0)

### Prices:
- `boatTypeId`: Reference to BoatType
- `zoneId`: Reference to Zone (null for global prices)
- `tripType`: 'Full Trip', 'Half Trip', or 'Cross Trip'
- `price`: Price amount in ₹
- `isActive`: Boolean (default: true)

## Base Prices (Full Trip)

- Motor Boat Small: ₹1,000
- Motor Boat Medium: ₹2,000
- Motor Boat Large: ₹3,000
- Motor Boat Extra Large: ₹4,000

## Important Notes

⚠️ **Warning**: These seeders will DELETE all existing data before creating new ones.

⚠️ **Zones Seeder**: If zones have boats assigned, those boats will remain in the database but their zone reference will be broken. Make sure to reassign boats after seeding.

⚠️ **Boat Types Seeder**: If boat types have associated boats, those boats will remain but their boatType reference will be broken. Make sure to reassign boats after seeding.

⚠️ **Prices Seeder**: Requires boat types to be seeded first! Run `seed:boatTypes` before running `seed:prices`. Zones are not required as we create only global prices.

## Recommended Seeding Order

1. **First**: `npm run seed:boatTypes` - Create boat types
2. **Second**: `npm run seed:zones` - Create zones and ghats
3. **Third**: `npm run seed:prices` - Create prices (requires boat types only)

## Example Output

### Zones Seeder:
```
✅ Connected to MongoDB

🗑️  Step 1: Deleting existing zones and ghats...
✅ Deleted 0 ghat(s)
✅ Deleted 0 zone(s)

📝 Step 2: Creating zones with ghats (new flow)...

✅ Created zone: ZONE-001 - Zone 1
   Boarding Points: Assi Ghat
   Creating 9 ghat(s)...
  ✅ Created GHAT-001: Assi Ghat
  ✅ Created GHAT-002: Ganga Mahal Ghat
  ...
   ✓ Zone updated with 9 ghat(s)

🎉 Seeding completed successfully!
✅ Created 15 zone(s)
✅ Created 95 ghat(s) in Ghat model
```

### Boat Types Seeder:
```
✅ Connected to MongoDB

🔍 Step 1: Checking for associated boats...
🗑️  Step 2: Deleting existing boat types...
✅ Deleted 0 boat type(s)

📝 Step 3: Creating boat types...

✅ Created BOAT-001: Motor Boat Small
   Capacity: 10 passengers
   Number of Boats: 0

✅ Created BOAT-002: Motor Boat Medium
   Capacity: 20 passengers
   Number of Boats: 0

🎉 Seeding completed successfully!
✅ Created 4 boat type(s)
```

### Prices Seeder:
```
✅ Connected to MongoDB

🔍 Step 1: Checking prerequisites...
✅ Found 4 boat type(s)
ℹ️  Creating only global prices (All Zones)

🗑️  Step 2: Deleting existing prices...
✅ Deleted 0 price(s)

📝 Step 3: Creating global prices (All Zones)...

📦 Processing Motor Boat Small (Base Price: ₹1000)...
  ✅ All Zones - Full Trip: ₹1000
  ✅ All Zones - Half Trip: ₹500
  ✅ All Zones - Cross Trip: ₹2000

📦 Processing Motor Boat Medium (Base Price: ₹2000)...
  ✅ All Zones - Full Trip: ₹2000
  ✅ All Zones - Half Trip: ₹1000
  ✅ All Zones - Cross Trip: ₹4000

🎉 Seeding completed successfully!
✅ Created 12 price(s)

📊 Summary:
   Total Prices: 12
   Active Prices: 12
   All prices are Global (All Zones)

📋 All Prices:
   Motor Boat Extra Large - Cross Trip: ₹8000
   Motor Boat Extra Large - Full Trip: ₹4000
   Motor Boat Extra Large - Half Trip: ₹2000
   Motor Boat Large - Cross Trip: ₹6000
   Motor Boat Large - Full Trip: ₹3000
   Motor Boat Large - Half Trip: ₹1500
   Motor Boat Medium - Cross Trip: ₹4000
   Motor Boat Medium - Full Trip: ₹2000
   Motor Boat Medium - Half Trip: ₹1000
   Motor Boat Small - Cross Trip: ₹2000
   Motor Boat Small - Full Trip: ₹1000
   Motor Boat Small - Half Trip: ₹500
```

