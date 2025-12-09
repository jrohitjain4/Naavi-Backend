# Seeders

This folder contains database seeders for populating initial data.

## Available Seeders

### `seedZonesAndGhats.js`
Seeds zones and ghats with the new flow where:
- Zones are created with ghat names
- Ghats are automatically created in the Ghat model
- Zone's `ghats` array stores `ghatId` references
- Boarding points are included for each zone

## Usage

### Run Zone and Ghat Seeder

```bash
cd Navi-backend
node seeders/seedZonesAndGhats.js
```

## What it does:

1. **Deletes all existing zones and ghats** (be careful if you have production data!)
2. **Creates 15 zones** with proper zone IDs (ZONE-001 to ZONE-015)
3. **Creates ghats automatically** when zones are created (using the new flow)
4. **Stores ghatIds** in Zone's ghats array (not just names)
5. **Sets boarding points** for each zone

## Data Structure

Each zone includes:
- `zoneId`: Auto-generated (ZONE-001, ZONE-002, etc.)
- `zoneName`: Zone name
- `ghats`: Array of ghat names (will be converted to ghatIds)
- `boardingPoints`: Array of boarding point names
- `status`: 'Active' by default

## Important Notes

⚠️ **Warning**: This seeder will DELETE all existing zones and ghats before creating new ones.

⚠️ If zones have boats assigned, those boats will remain in the database but their zone reference will be broken. Make sure to reassign boats after seeding.

## Example Output

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

