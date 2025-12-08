# Boat Type & Driver API - Complete Documentation

## Base URL: `http://localhost:5000/api`

---

## 📋 Table of Contents
1. [Boat Type APIs (Admin)](#boat-type-apis-admin)
2. [Driver Authentication Flow](#driver-authentication-flow)
3. [Driver Profile Completion](#driver-profile-completion)
4. [Driver Boat Registration](#driver-boat-registration)
5. [Admin Driver Management](#admin-driver-management)
6. [Complete Flow Diagram](#complete-flow-diagram)

---

## 🚤 BOAT TYPE APIs (Admin)

### Overview
Boat Types are created by Admin. These are templates that define boat categories (Small, Medium, Large, etc.) with their capacity. Drivers select from these boat types when registering their actual boats.

### 1.1 Get All Boat Types
```
GET /api/boats
// Public endpoint - no auth required

Response: [
  {
    "_id": "boat_type_mongodb_id",
    "boatId": "BOAT-001",
    "boatType": "Small",
    "capacity": 10,
    "numberOfBoats": 5,
    "createdAt": "2025-01-08T10:00:00.000Z",
    "updatedAt": "2025-01-08T10:00:00.000Z"
  },
  {
    "_id": "boat_type_mongodb_id_2",
    "boatId": "BOAT-002",
    "boatType": "Medium",
    "capacity": 20,
    "numberOfBoats": 3,
    "createdAt": "2025-01-08T10:00:00.000Z",
    "updatedAt": "2025-01-08T10:00:00.000Z"
  }
]
```

### 1.2 Get Single Boat Type
```
GET /api/boats/:id
// Public endpoint - no auth required

Response: {
  "_id": "boat_type_mongodb_id",
  "boatId": "BOAT-001",
  "boatType": "Small",
  "capacity": 10,
  "numberOfBoats": 5,
  "createdAt": "2025-01-08T10:00:00.000Z",
  "updatedAt": "2025-01-08T10:00:00.000Z"
}
```

### 1.3 Create Boat Type (Admin Only)
```
POST /api/boats
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Body: {
  "boatType": "Large",
  "capacity": 30
}

Response: {
  "message": "Boat type created successfully",
  "boat": {
    "_id": "boat_type_mongodb_id",
    "boatId": "BOAT-003", // Auto-generated
    "boatType": "Large",
    "capacity": 30,
    "numberOfBoats": 0, // Default
    "createdAt": "2025-01-08T10:00:00.000Z",
    "updatedAt": "2025-01-08T10:00:00.000Z"
  }
}
```

### 1.4 Update Boat Type (Admin Only)
```
PUT /api/boats/:id
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Body: {
  "boatType": "Large",
  "capacity": 35,
  "numberOfBoats": 10
}

Response: {
  "message": "Boat type updated successfully",
  "boat": { /* updated boat type */ }
}
```

### 1.5 Delete Boat Type (Admin Only)
```
DELETE /api/boats/:id
Headers: {
  "Authorization": "Bearer <admin_token>"
}

Response: {
  "message": "Boat type deleted successfully"
}
```

### 1.6 Get Boat Type Statistics (Admin Only)
```
GET /api/boats/stats
Headers: {
  "Authorization": "Bearer <admin_token>"
}

Response: {
  "total": 5, // Total boat types
  "totalBoats": 25 // Sum of numberOfBoats from all types
}
```

---

## 🔐 DRIVER AUTHENTICATION FLOW

### Step 1: Send OTP
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

### Step 2: Verify OTP & Login/Register
```
POST /api/driver-auth/verify-otp
Body: {
  "mobileNo": "9876543210",
  "otp": "123456"
}

Response (New Driver - First Time):
{
  "message": "OTP verified. Please complete your profile.",
  "status": "pending",
  "isNewUser": true,
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001", // Auto-generated
    "mobileNo": "9876543210",
    "status": "Pending"
  }
}

Response (Existing Approved Driver):
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "firstName": "John",
    "lastName": "Doe",
    "mobileNo": "9876543210",
    "status": "Approved",
    "isActive": true
  },
  "isNewUser": false
}

Response (Pending Driver - Not Approved Yet):
{
  "message": "Account pending approval",
  "status": "pending",
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "status": "Pending",
    "isActive": false
  }
}
```

---

## 👤 DRIVER PROFILE COMPLETION (Step 1)

### Complete Driver Profile
```
POST /api/driver-profile/complete
Content-Type: multipart/form-data
Headers: {
  "Authorization": "Bearer <driver_token>" // Optional
}
Body (FormData):
  - driverId: "driver_mongodb_id" // If no token
  - firstName: "John"
  - lastName: "Doe"
  - address: "123 Main Street, City, State"
  - password: "securePassword123"
  - zoneId: "zone_mongodb_id" // Select from GET /api/zones
  - aadharCard: <file> // Image file
  - panCard: <file> // Image file
  - boatDrivingLicense: <file> // Image file

Response: {
  "message": "Profile completed successfully. Please register your boat.",
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main Street, City, State",
    "mobileNo": "9876543210",
    "zoneId": "zone_mongodb_id",
    "zoneName": "Zone 1",
    "status": "Pending",
    "isActive": false
  }
}
```

### Get Driver Profile
```
GET /api/driver-profile/my-profile
Headers: {
  "Authorization": "Bearer <driver_token>"
}
OR
GET /api/driver-profile/:driverId

Response: {
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main Street",
    "mobileNo": "9876543210",
    "aadharCard": "uploads/drivers/aadharCard-123.jpg",
    "panCard": "uploads/drivers/panCard-456.jpg",
    "boatDrivingLicense": "uploads/drivers/boatDrivingLicense-789.jpg",
    "zoneId": {
      "_id": "zone_mongodb_id",
      "zoneId": "ZONE-001",
      "zoneName": "Zone 1"
    },
    "status": "Pending",
    "isActive": false
  }
}
```

---

## 🚤 DRIVER BOAT REGISTRATION (Step 2)

### Get Available Boat Types
```
GET /api/boats
// Public endpoint - returns all admin-created boat types

Response: [
  {
    "_id": "boat_type_mongodb_id",
    "boatId": "BOAT-001",
    "boatType": "Small",
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

### Register Boat
```
POST /api/driver-boat/register
Content-Type: multipart/form-data
Headers: {
  "Authorization": "Bearer <driver_token>" // Optional
}
Body (FormData):
  - driverId: "driver_mongodb_id" // If no token
  - boatTypeId: "boat_type_mongodb_id" // Required - Select from GET /api/boats
  - boatNumber: "UP-12345" // Government Authority number
  - state: "Uttar Pradesh"
  - city: "Varanasi"
  - ghatId: "ghat_mongodb_id" // Optional
  - zoneId: "zone_mongodb_id" // Must match driver's zone
  - boatRegistrationPaper: <file> // PDF/Image file

Response: {
  "message": "Boat registered successfully. Request submitted for admin approval.",
  "boat": {
    "_id": "boat_mongodb_id",
    "boatId": "BOAT-ZONE001-001", // Auto-generated based on zone
    "boatTypeId": "boat_type_mongodb_id",
    "boatNumber": "UP-12345",
    "boatType": "Medium", // From admin boat type
    "capacity": 20, // From admin boat type
    "state": "Uttar Pradesh",
    "city": "Varanasi",
    "zoneId": "zone_mongodb_id",
    "zoneName": "Zone 1",
    "status": "Pending",
    "associatedDriverId": "driver_mongodb_id"
  },
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "status": "Pending"
  }
}
```

**Important Notes:**
- `boatTypeId` must be selected from available boat types (GET /api/boats)
- `zoneId` must match the driver's zone (set in profile completion)
- `boatType` and `capacity` are automatically copied from the selected `BoatType`
- `boatId` is auto-generated in format: `BOAT-ZONE{zoneNumber}-{boatNumber}`

### Get Driver's Boat
```
GET /api/driver-boat/my-boat
Headers: {
  "Authorization": "Bearer <driver_token>"
}
OR
GET /api/driver-boat/:driverId

Response: {
  "boat": {
    "_id": "boat_mongodb_id",
    "boatId": "BOAT-ZONE001-001",
    "boatTypeId": {
      "_id": "boat_type_mongodb_id",
      "boatId": "BOAT-001",
      "boatType": "Medium",
      "capacity": 20
    },
    "boatNumber": "UP-12345",
    "boatType": "Medium",
    "capacity": 20,
    "state": "Uttar Pradesh",
    "city": "Varanasi",
    "zoneId": {
      "_id": "zone_mongodb_id",
      "zoneId": "ZONE-001",
      "zoneName": "Zone 1"
    },
    "ghatId": {
      "_id": "ghat_mongodb_id",
      "ghatId": "GHAT-001",
      "ghatName": "Ghat 1"
    },
    "associatedDriverId": {
      "_id": "driver_mongodb_id",
      "driverId": "DRIVER-001",
      "firstName": "John",
      "lastName": "Doe"
    },
    "boatRegistrationPaper": "uploads/boats/boatRegistrationPaper-123.pdf",
    "status": "Pending"
  }
}
```

---

## 👨‍💼 ADMIN DRIVER MANAGEMENT

### Get All Drivers
```
GET /api/drivers
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Query Params (optional):
  - status: "Pending" | "Approved" | "Rejected"

Response: [
  {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "firstName": "John",
    "lastName": "Doe",
    "mobileNo": "9876543210",
    "status": "Pending",
    "zoneId": {
      "_id": "zone_mongodb_id",
      "zoneId": "ZONE-001",
      "zoneName": "Zone 1"
    },
    "associatedBoatId": "boat_mongodb_id",
    "isActive": false
  }
]
```

### Get Pending Drivers
```
GET /api/drivers/pending
Headers: {
  "Authorization": "Bearer <admin_token>"
}

Response: [/* Array of pending drivers */]
```

### Get Single Driver (with all details)
```
GET /api/drivers/:id
Headers: {
  "Authorization": "Bearer <admin_token>"
}

Response: {
  "_id": "driver_mongodb_id",
  "driverId": "DRIVER-001",
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main Street",
  "mobileNo": "9876543210",
  "aadharCard": "uploads/drivers/aadharCard-123.jpg",
  "panCard": "uploads/drivers/panCard-456.jpg",
  "boatDrivingLicense": "uploads/drivers/boatDrivingLicense-789.jpg",
  "zoneId": {
    "_id": "zone_mongodb_id",
    "zoneId": "ZONE-001",
    "zoneName": "Zone 1"
  },
  "associatedBoatId": {
    "_id": "boat_mongodb_id",
    "boatId": "BOAT-ZONE001-001",
    "boatNumber": "UP-12345",
    "boatType": "Medium",
    "boatRegistrationPaper": "uploads/boats/..."
  },
  "status": "Pending",
  "isActive": false
}
```

### Approve Driver
```
PUT /api/drivers/:id/approve
Headers: {
  "Authorization": "Bearer <admin_token>"
}

Response: {
  "message": "Driver approved successfully",
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "status": "Approved",
    "isActive": true
  },
  "boat": {
    "_id": "boat_mongodb_id",
    "status": "Available" // Boat status also updated
  }
}
```

### Reject Driver
```
PUT /api/drivers/:id/reject
Headers: {
  "Authorization": "Bearer <admin_token>"
}
Body (optional): {
  "reason": "Documents not clear"
}

Response: {
  "message": "Driver rejected",
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "status": "Rejected",
    "isActive": false
  }
}
```

---

## 📊 COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    DRIVER REGISTRATION FLOW                  │
└─────────────────────────────────────────────────────────────┘

STEP 1: AUTHENTICATION
┌─────────────────┐
│  Send OTP       │ POST /api/driver-auth/send-otp
│  (Mobile No)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify OTP     │ POST /api/driver-auth/verify-otp
│  (Mobile + OTP) │
└────────┬────────┘
         │
         ├─→ New User? → Go to STEP 2
         │
         ├─→ Pending? → Wait for Admin Approval
         │
         └─→ Approved? → Login Successful (Get Token)


STEP 2: PROFILE COMPLETION
┌─────────────────────────────────────────┐
│  Complete Profile                       │
│  POST /api/driver-profile/complete      │
│                                         │
│  Fields:                                │
│  - firstName, lastName                  │
│  - address                              │
│  - password                             │
│  - zoneId (select from /api/zones)      │
│  - aadharCard (file)                    │
│  - panCard (file)                       │
│  - boatDrivingLicense (file)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Profile Saved                          │
│  Status: Pending                        │
└──────────────┬──────────────────────────┘
               │
               ▼
STEP 3: BOAT REGISTRATION
┌─────────────────────────────────────────┐
│  1. Get Boat Types                      │
│     GET /api/boats                      │
│     (Returns all admin-created types)    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Register Boat                        │
│     POST /api/driver-boat/register      │
│                                         │
│  Fields:                                │
│  - boatTypeId (select from boat types)  │
│  - boatNumber (Govt. Authority No.)     │
│  - state, city                          │
│  - zoneId (must match driver's zone)    │
│  - ghatId (optional)                     │
│  - boatRegistrationPaper (file)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Boat Registered                         │
│  Status: Pending                         │
│  (boatType & capacity auto-filled)      │
└──────────────┬──────────────────────────┘
               │
               ▼
STEP 4: ADMIN APPROVAL
┌─────────────────────────────────────────┐
│  Admin Reviews:                         │
│  - Driver Profile                       │
│  - Documents                            │
│  - Boat Details                         │
│                                         │
│  Admin Actions:                         │
│  - Approve: PUT /api/drivers/:id/approve│
│  - Reject: PUT /api/drivers/:id/reject  │
└──────────────┬──────────────────────────┘
               │
               ├─→ Approved
               │   ├─→ Driver Status: Approved
               │   ├─→ Driver isActive: true
               │   ├─→ Boat Status: Available
               │   └─→ Driver can login & work
               │
               └─→ Rejected
                   ├─→ Driver Status: Rejected
                   ├─→ Driver isActive: false
                   └─→ Driver needs to reapply
```

---

## 🔑 KEY CONCEPTS

### BoatType vs Boat

**BoatType (Admin Creates):**
- Template/Category definition
- Examples: "Small", "Medium", "Large"
- Contains: `boatType`, `capacity`, `numberOfBoats`
- Used as reference when drivers register boats

**Boat (Driver Registers):**
- Actual physical boat owned by driver
- Contains: `boatNumber`, `state`, `city`, `zoneId`, etc.
- References a `BoatType` via `boatTypeId`
- Auto-copies `boatType` and `capacity` from `BoatType`

### Status Flow

**Driver Status:**
- `Pending` → Initial state after registration
- `Approved` → Admin approved, can login
- `Rejected` → Admin rejected, cannot login

**Boat Status:**
- `Pending` → Initial state after registration
- `Available` → Approved and ready for bookings
- `In Service` → Currently on a trip
- `Maintenance` → Under maintenance

### Zone Matching
- Driver must select a zone during profile completion
- Boat must be registered in the same zone as driver
- Zone validation is enforced in boat registration

---

## 📝 NOTES

1. **OTP System**: Uses same OTP mechanism as customer app
2. **File Uploads**: All documents uploaded to `uploads/drivers/` and `uploads/boats/`
3. **Auto-Generation**: 
   - `driverId`: Format `DRIVER-001`, `DRIVER-002`, etc.
   - `boatId`: Format `BOAT-ZONE001-001` (zone-based)
   - `boatTypeId`: Format `BOAT-001`, `BOAT-002`, etc.
4. **Authentication**: JWT tokens for authenticated endpoints
5. **Public Endpoints**: 
   - `GET /api/boats` (boat types)
   - `GET /api/zones`
   - `GET /api/ghats`

---

## 🚨 ERROR HANDLING

### Common Errors

**400 Bad Request:**
- Missing required fields
- Invalid zone (boat zone must match driver zone)
- Boat number already exists
- Invalid boat type ID

**401 Unauthorized:**
- Missing or invalid token
- Token expired

**404 Not Found:**
- Boat type not found
- Zone not found
- Driver not found
- Boat not found

**500 Server Error:**
- Database connection issues
- File upload failures
- Internal server errors

---

## 📞 API ENDPOINTS SUMMARY

### Boat Types (Public)
- `GET /api/boats` - Get all boat types
- `GET /api/boats/:id` - Get single boat type

### Boat Types (Admin Only)
- `POST /api/boats` - Create boat type
- `PUT /api/boats/:id` - Update boat type
- `DELETE /api/boats/:id` - Delete boat type
- `GET /api/boats/stats` - Get statistics

### Driver Auth (Public)
- `POST /api/driver-auth/send-otp` - Send OTP
- `POST /api/driver-auth/verify-otp` - Verify OTP & Login

### Driver Profile (Driver Auth)
- `POST /api/driver-profile/complete` - Complete profile
- `GET /api/driver-profile/my-profile` - Get profile
- `GET /api/driver-profile/:driverId` - Get profile by ID

### Driver Boat (Driver Auth)
- `POST /api/driver-boat/register` - Register boat
- `GET /api/driver-boat/my-boat` - Get my boat
- `GET /api/driver-boat/:driverId` - Get boat by driver ID

### Admin Driver Management (Admin Auth)
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/pending` - Get pending drivers
- `GET /api/drivers/:id` - Get single driver
- `PUT /api/drivers/:id/approve` - Approve driver
- `PUT /api/drivers/:id/reject` - Reject driver

---

**Last Updated:** January 2025

