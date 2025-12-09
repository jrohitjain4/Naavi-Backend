# Driver Registration - Zones & Ghats API

## API Endpoint for Driver Registration

### Get All Zones with Ghats (Boarding Points)

**Endpoint:** `GET /api/zones`

**Authentication:** Not required (Public endpoint)

**Base URL:** `http://localhost:5000/api`

**Full URL:** `http://localhost:5000/api/zones`

---

## Response Format

```json
[
  {
    "_id": "6937cedef793c336a703fa71",
    "zoneId": "ZONE-001",
    "zoneName": "Zone 1",
    "ghats": [
      {
        "ghatId": "GHAT-001",
        "name": "Assi Ghat"
      },
      {
        "ghatId": "GHAT-002",
        "name": "Ganga Mahal Ghat"
      },
      {
        "ghatId": "GHAT-003",
        "name": "Riva (Rewan) Ghat"
      }
    ],
    "totalGhats": 9,
    "boats": 0,
    "status": "Active",
    "boardingPoints": ["Assi Ghat", "Ganga Mahal Ghat"],
    "createdAt": "2025-01-08T10:00:00.000Z",
    "updatedAt": "2025-01-08T10:00:00.000Z"
  },
  {
    "_id": "6937cedff793c336a703faa7",
    "zoneId": "ZONE-002",
    "zoneName": "Zone 2",
    "ghats": [
      {
        "ghatId": "GHAT-010",
        "name": "Nishadraj (Nishad) Ghat"
      },
      {
        "ghatId": "GHAT-011",
        "name": "Prabhu Ghat"
      }
    ],
    "totalGhats": 6,
    "boats": 0,
    "status": "Active",
    "boardingPoints": [],
    "createdAt": "2025-01-08T10:00:00.000Z",
    "updatedAt": "2025-01-08T10:00:00.000Z"
  }
]
```

---

## Response Fields

### Zone Object:
- `_id`: MongoDB ObjectId (use this for zoneId in driver registration)
- `zoneId`: Zone identifier (e.g., "ZONE-001")
- `zoneName`: Zone name (e.g., "Zone 1")
- `ghats`: Array of ghat objects
  - `ghatId`: Ghat identifier (e.g., "GHAT-001")
  - `name`: Ghat name (e.g., "Assi Ghat")
- `totalGhats`: Number of ghats in this zone
- `boats`: Number of boats in this zone
- `status`: "Active" or "Inactive"
- `boardingPoints`: Array of boarding point names
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

---

## Usage in Driver Registration

### Example: React Native / JavaScript

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Fetch zones for driver registration
const fetchZones = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/zones`);
    const zones = response.data;
    
    // Process zones for dropdown/selection
    zones.forEach(zone => {
      console.log(`Zone: ${zone.zoneName} (${zone.zoneId})`);
      zone.ghats.forEach(ghat => {
        console.log(`  - ${ghat.name} (${ghat.ghatId})`);
      });
    });
    
    return zones;
  } catch (error) {
    console.error('Error fetching zones:', error);
    throw error;
  }
};
```

### Example: Display in Modal/Dropdown

```javascript
// For "Select Boarding Point" modal
const displayGhats = (zones) => {
  const ghatsList = [];
  
  zones.forEach(zone => {
    zone.ghats.forEach(ghat => {
      ghatsList.push({
        id: ghat.ghatId,
        name: `${ghat.name} (${zone.zoneId})`,
        zoneId: zone._id,
        zoneName: zone.zoneName,
        ghatId: ghat.ghatId,
        ghatName: ghat.name
      });
    });
  });
  
  return ghatsList;
};
```

---

## For Driver Profile Submission

When submitting driver profile, use:

```javascript
// Driver profile data
const driverData = {
  firstName: "John",
  lastName: "Doe",
  mobileNo: "9876543210",
  address: "123 Main Street",
  zoneId: zone._id,  // Use MongoDB _id from zone object
  // ... other fields
};
```

**Important:** Use `zone._id` (MongoDB ObjectId) for `zoneId` field in driver registration, NOT `zone.zoneId` (string like "ZONE-001").

---

## Error Handling

```javascript
try {
  const zones = await fetchZones();
  // Use zones data
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Server error:', error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.request);
  } else {
    // Something else
    console.error('Error:', error.message);
  }
}
```

---

## Notes

1. **Public Endpoint:** No authentication token required
2. **Ghats Array:** Each zone contains a `ghats` array with `ghatId` and `name`
3. **Zone ID:** Use `_id` (MongoDB ObjectId) for database references, not `zoneId` (string)
4. **Active Zones Only:** Filter by `status: "Active"` if needed
5. **Ghat Display:** Format as `"Ghat Name (ZONE-XXX)"` for user display

---

## Testing

### Using cURL:
```bash
curl http://localhost:5000/api/zones
```

### Using Postman:
- Method: GET
- URL: `http://localhost:5000/api/zones`
- Headers: None required
- Body: None

---

## Related Endpoints

- `GET /api/zones/:id` - Get single zone by ID
- `GET /api/ghats` - Get all ghats (alternative)
- `GET /api/ghats/zone/:zoneId` - Get ghats by zone ID

