# Driver App - Complete API Routes

## Base URL: `http://localhost:5000/api`

---

## 🔐 STEP 1: Driver Authentication (OTP Based)

### 1.1 Send OTP
```
POST /api/driver-auth/send-otp
Body: {
  "mobileNo": "9876543210"
}
Response: {
  "message": "OTP sent successfully",
  "otpExpiry": "2025-01-08T10:35:00.000Z"
}
```

### 1.2 Verify OTP & Login/Register
```
POST /api/driver-auth/verify-otp
Body: {
  "mobileNo": "9876543210",
  "otp": "123456"
}
Response (New Driver): {
  "message": "OTP verified. Please complete your profile.",
  "status": "pending",
  "isNewUser": true,
  "driver": {
    "_id": "...",
    "driverId": "DRIVER-001",
    "mobileNo": "9876543210",
    "status": "Pending"
  }
}
Response (Existing Approved Driver): {
  "message": "Login successful",
  "token": "jwt_token_here",
  "driver": {...},
  "isNewUser": false
}
Response (Pending Driver): {
  "message": "Account pending approval",
  "status": "pending",
  "driver": {...}
}
```

---

## 📝 STEP 2: Complete Driver Profile

### 2.1 Get Zones (for zone selection)
```
GET /api/zones
// Public route - no auth required
Response: [
  {
    "_id": "...",
    "zoneId": "ZONE-001",
    "zoneName": "Zone 1",
    "boardingPoints": ["Assi Ghat", "Dashashwamedh Ghat"],
    ...
  }
]
```

### 2.2 Complete Profile (Step 1)
```
POST /api/driver-profile/complete
Content-Type: multipart/form-data
Headers: {
  "Authorization": "Bearer <driver_token>" // Optional for new registration
}
Body (FormData):
  - firstName: "John"
  - lastName: "Doe"
  - address: "123 Main Street, City"
  - mobileNo: "9876543210"
  - password: "password123"
  - zoneId: "zone_mongodb_id"
  - aadharCard: <file>
  - panCard: <file>
  - boatDrivingLicense: <file>

Response: {
  "message": "Profile completed successfully. Please register your boat.",
  "driver": {
    "_id": "...",
    "driverId": "DRIVER-001",
    "firstName": "John",
    "lastName": "Doe",
    "status": "Pending",
    "zoneId": "...",
    "zoneName": "Zone 1"
  }
}
```

### 2.3 Get Driver Profile
```
GET /api/driver-profile/profile
Headers: {
  "Authorization": "Bearer <driver_token>"
}
OR
GET /api/driver-profile/profile/:id

Response: {
  "driver": {
    "_id": "...",
    "driverId": "DRIVER-001",
    "firstName": "John",
    "lastName": "Doe",
    "address": "...",
    "mobileNo": "...",
    "zoneId": {...},
    "zoneName": "Zone 1",
    "status": "Pending",
    "aadharCard": "uploads/drivers/aadharCard-123.jpg",
    "panCard": "uploads/drivers/panCard-456.jpg",
    "boatDrivingLicense": "uploads/drivers/boatDrivingLicense-789.jpg",
    "associatedBoatId": null
  }
}
```

---

## 🚤 STEP 3: Register Boat

### 3.1 Get Ghats (for ghat selection - optional)
```
GET /api/ghats/zone/:zoneId
// Public route - no auth required
Response: [
  {
    "_id": "...",
    "ghatId": "GHAT-001",
    "ghatName": "Assi Ghat",
    "zoneId": "...",
    "zoneName": "Zone 1"
  }
]
```

### 3.2 Get Boat Types (Admin Created)
```
GET /api/boats
// Public endpoint - no auth required

Response: [
  {
    "_id": "boat_type_mongodb_id",
    "boatId": "BOAT-001",
    "boatType": "Small", // or "Medium", "Large", etc.
    "capacity": 10,
    "numberOfBoats": 5
  },
  {
    "_id": "boat_type_mongodb_id_2",
    "boatId": "BOAT-002",
    "boatType": "Medium",
    "capacity": 20,
    "numberOfBoats": 3
  }
]
```

### 3.3 Register Boat (Step 2)
```
POST /api/driver-boat/register
Content-Type: multipart/form-data
Headers: {
  "Authorization": "Bearer <driver_token>" // Optional
}
Body (FormData):
  - driverId: "driver_mongodb_id" // If no token
  - boatTypeId: "boat_type_mongodb_id" // Required - Select from admin-created boat types (GET /api/boats)
  - boatNumber: "UP-12345" // Government Authority number
  - state: "Uttar Pradesh"
  - city: "Varanasi"
  - ghatId: "ghat_mongodb_id" // Optional
  - zoneId: "zone_mongodb_id" // Must match driver's zone
  - boatRegistrationPaper: <file>

Response: {
  "message": "Boat registered successfully. Request submitted for admin approval.",
  "boat": {
    "_id": "...",
    "boatId": "BOAT-ZONE001-001",
    "boatTypeId": "boat_type_mongodb_id",
    "boatNumber": "UP-12345",
    "boatType": "Medium", // From admin boat type
    "capacity": 20, // From admin boat type
    "zoneId": "...",
    "zoneName": "Zone 1",
    "status": "Pending"
  },
  "driver": {
    "_id": "...",
    "driverId": "DRIVER-001",
    "status": "Pending"
  }
}
```

### 3.4 Get Driver's Boat
```
GET /api/driver-boat/my-boat
Headers: {
  "Authorization": "Bearer <driver_token>"
}
OR
GET /api/driver-boat/:driverId

Response: {
  "boat": {
    "_id": "...",
    "boatId": "BOAT-ZONE001-001",
    "boatTypeId": {
      "_id": "boat_type_mongodb_id",
      "boatId": "BOAT-001",
      "boatType": "Medium",
      "capacity": 20
    },
    "boatNumber": "UP-12345",
    "boatType": "Medium", // From admin boat type
    "capacity": 20, // From admin boat type
    "state": "Uttar Pradesh",
    "city": "Varanasi",
    "zoneId": {...},
    "ghatId": {...},
    "associatedDriverId": {...},
    "boatRegistrationPaper": "uploads/boats/boatRegistrationPaper-123.pdf",
    "status": "Pending"
  }
}
```

---

## 👨‍💼 ADMIN APIs (Driver Management)

### 4.1 Get All Drivers
```
GET /api/drivers
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Query Params (optional):
  - status: "Pending" | "Approved" | "Rejected"

Response: [
  {
    "_id": "...",
    "driverId": "DRIVER-001",
    "firstName": "John",
    "lastName": "Doe",
    "mobileNo": "9876543210",
    "status": "Pending",
    "zoneId": {...},
    "associatedBoatId": {...},
    ...
  }
]
```

### 4.2 Get Pending Drivers
```
GET /api/drivers/pending
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Response: [/* Array of pending drivers */]
```

### 4.3 Get Single Driver (with all details)
```
GET /api/drivers/:id
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Response: {
  "_id": "...",
  "driverId": "DRIVER-001",
  "firstName": "John",
  "lastName": "Doe",
  "address": "...",
  "mobileNo": "...",
  "aadharCard": "uploads/drivers/aadharCard-123.jpg",
  "panCard": "uploads/drivers/panCard-456.jpg",
  "boatDrivingLicense": "uploads/drivers/boatDrivingLicense-789.jpg",
  "zoneId": {...},
  "associatedBoatId": {
    "boatId": "BOAT-ZONE001-001",
    "boatNumber": "UP-12345",
    "boatType": "Motor",
    "boatRegistrationPaper": "uploads/boats/..."
  },
  "status": "Pending",
  "isActive": false
}
```

### 4.4 Approve Driver
```
PUT /api/drivers/:id/approve
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Response: {
  "message": "Driver approved successfully",
  "driver": {
    "_id": "...",
    "driverId": "DRIVER-001",
    "status": "Approved",
    "isActive": true
  }
}
```

### 4.5 Reject Driver
```
PUT /api/drivers/:id/reject
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Body: {
  "rejectionReason": "Documents not clear" // Optional
}
Response: {
  "message": "Driver rejected successfully",
  "driver": {
    "_id": "...",
    "driverId": "DRIVER-001",
    "status": "Rejected",
    "isActive": false
  }
}
```

### 4.6 Get Driver Statistics
```
GET /api/drivers/stats
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Response: {
  "total": 50,
  "onDuty": 10,
  "onTrip": 5,
  "offDuty": 35
}
```

---

## 📋 Complete Flow Summary

### Driver Registration Flow:
```
1. POST /api/driver-auth/send-otp
   → Enter mobile number

2. POST /api/driver-auth/verify-otp
   → Verify OTP, get driver ID

3. GET /api/zones
   → Get zones list for selection

4. POST /api/driver-profile/complete
   → Complete profile with documents
   → Status: Pending

5. GET /api/ghats/zone/:zoneId (optional)
   → Get ghats for selected zone

6. POST /api/driver-boat/register
   → Register boat
   → Boat linked to driver
   → Status: Pending

7. Admin reviews → PUT /api/drivers/:id/approve
   → Driver status: Approved
   → Driver can now login
```

### Driver Login Flow (After Approval):
```
1. POST /api/driver-auth/send-otp
2. POST /api/driver-auth/verify-otp
   → Get JWT token
   → Access driver APIs
```

---

## 🔑 Authentication

### Driver Token:
- Generated after OTP verification (only for approved drivers)
- Header: `Authorization: Bearer <token>`
- Valid for: 30 days

### Admin Token:
- Required for all `/api/drivers/*` routes
- Header: `Authorization: Bearer <admin_token>`

---

## 📁 File Uploads

### Driver Documents:
- Location: `uploads/drivers/`
- Fields: `aadharCard`, `panCard`, `boatDrivingLicense`
- Max size: 5MB
- Formats: jpg, jpeg, png, pdf

### Boat Documents:
- Location: `uploads/boats/`
- Field: `boatRegistrationPaper`
- Max size: 5MB
- Formats: jpg, jpeg, png, pdf

---

## ⚠️ Important Notes

1. **Zone Validation**: Driver and boat must be in same zone
2. **Status Flow**: Pending → Approved/Rejected
3. **Boat ID Format**: `BOAT-ZONE001-001` (zone-based)
4. **Driver ID Format**: `DRIVER-001` (sequential)
5. **OTP**: Use `123456` for testing (dummy OTP)
6. **File Access**: Files served at `/uploads/*` path

