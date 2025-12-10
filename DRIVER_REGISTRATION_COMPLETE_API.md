# Driver Registration - Complete API Guide

## 📋 Overview

Driver registration **2 steps** me complete hoti hai:
1. **Step 1:** Driver Profile Complete (Personal Info + Documents)
2. **Step 2:** Boat Registration (Boat Details + Documents)

---

## 🔐 STEP 1: Driver Authentication (OTP)

### 1.1 Send OTP
```
POST /api/driver-auth/send-otp
Content-Type: application/json

Body:
{
  "mobileNo": "9876543210"
}

Response:
{
  "message": "OTP sent successfully",
  "otpExpiry": "2025-01-08T10:35:00.000Z"
}
```

### 1.2 Verify OTP
```
POST /api/driver-auth/verify-otp
Content-Type: application/json

Body:
{
  "mobileNo": "9876543210",
  "otp": "123456"  // Use "123456" for testing
}

Response (New Driver):
{
  "message": "OTP verified. Please complete your profile.",
  "status": "pending",
  "isNewUser": true,
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "mobileNo": "9876543210",
    "status": "Pending"
  }
}
```

---

## 📝 STEP 2: Complete Driver Profile

### 2.1 Get Zones (for selection)
```
GET /api/zones
// Public - no auth required

Response: [
  {
    "_id": "6937cedef793c336a703fa71",  // ← Use this for zoneId
    "zoneId": "ZONE-001",
    "zoneName": "Zone 1",
    "ghats": [
      {
        "ghatId": "GHAT-001",
        "name": "Assi Ghat"
      }
    ],
    "boardingPoints": ["Assi Ghat"]
  }
]
```

### 2.2 Complete Profile API ⭐ (MAIN API)

```
POST /api/driver-profile/complete
Content-Type: multipart/form-data
Headers: {
  "Authorization": "Bearer <token>"  // Optional for new registration
}

Body (FormData):
  - firstName: "John"                    // REQUIRED
  - lastName: "Doe"                      // REQUIRED
  - address: "123 Main Street, City"    // REQUIRED
  - mobileNo: "9876543210"              // REQUIRED
  - password: "password123"             // REQUIRED
  - zoneId: "6937cedef793c336a703fa71"   // REQUIRED (MongoDB _id from GET /api/zones)
  - aadharCard: <file>                   // REQUIRED (Image/PDF)
  - panCard: <file>                      // REQUIRED (Image/PDF)
  - boatDrivingLicense: <file>           // REQUIRED (Image/PDF)

Response:
{
  "message": "Profile completed successfully. Please register your boat.",
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "firstName": "John",
    "lastName": "Doe",
    "mobileNo": "9876543210",
    "status": "Pending",
    "zoneId": "6937cedef793c336a703fa71",
    "zoneName": "Zone 1"
  }
}
```

### ⚠️ Required Fields (All Mandatory):

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `firstName` | String | Driver's first name | "John" |
| `lastName` | String | Driver's last name | "Doe" |
| `address` | String | Complete address | "123 Main St, Varanasi" |
| `mobileNo` | String | Mobile number (10 digits) | "9876543210" |
| `password` | String | Password (will be hashed) | "password123" |
| `zoneId` | String | MongoDB _id from zones API | "6937cedef793c336a703fa71" |
| `aadharCard` | File | Aadhar card image/PDF | `<file>` |
| `panCard` | File | PAN card image/PDF | `<file>` |
| `boatDrivingLicense` | File | Boat driving license | `<file>` |

### 📁 File Requirements:
- **Format:** jpg, jpeg, png, pdf
- **Max Size:** 5MB per file
- **Location:** Files saved in `uploads/drivers/`

---

## 🚤 STEP 3: Register Boat

### 3.1 Get Boat Types (for selection)
```
GET /api/boats
// Public - no auth required

Response: [
  {
    "_id": "boat_type_mongodb_id",  // ← Use this for boatTypeId
    "boatId": "BOAT-001",
    "boatType": "Small",
    "capacity": 10
  },
  {
    "_id": "boat_type_mongodb_id_2",
    "boatId": "BOAT-002",
    "boatType": "Medium",
    "capacity": 20
  }
]
```

### 3.2 Get Ghats (Optional - for ghat selection)
```
GET /api/ghats/zone/:zoneId
// Public - no auth required

Response: [
  {
    "_id": "ghat_mongodb_id",  // ← Use this for ghatId (optional)
    "ghatId": "GHAT-001",
    "ghatName": "Assi Ghat",
    "zoneId": "6937cedef793c336a703fa71",
    "zoneName": "Zone 1"
  }
]
```

### 3.3 Register Boat API ⭐

```
POST /api/driver-boat/register
Content-Type: multipart/form-data
Headers: {
  "Authorization": "Bearer <token>"  // Optional
}

Body (FormData):
  - driverId: "driver_mongodb_id"              // REQUIRED (from Step 2 response)
  - boatTypeId: "boat_type_mongodb_id"         // REQUIRED (from GET /api/boats)
  - boatNumber: "UP-12345"                     // REQUIRED (Government registration number)
  - state: "Uttar Pradesh"                      // REQUIRED
  - city: "Varanasi"                            // REQUIRED
  - zoneId: "6937cedef793c336a703fa71"          // REQUIRED (Must match driver's zone)
  - ghatId: "ghat_mongodb_id"                   // OPTIONAL
  - boatRegistrationPaper: <file>              // REQUIRED (PDF/Image)

Response:
{
  "message": "Boat registered successfully. Request submitted for admin approval.",
  "boat": {
    "_id": "boat_mongodb_id",
    "boatId": "BOAT-ZONE001-001",
    "boatTypeId": "boat_type_mongodb_id",
    "boatNumber": "UP-12345",
    "boatType": "Medium",
    "capacity": 20,
    "zoneId": "6937cedef793c336a703fa71",
    "zoneName": "Zone 1",
    "status": "Pending"
  },
  "driver": {
    "_id": "driver_mongodb_id",
    "driverId": "DRIVER-001",
    "status": "Pending"
  }
}
```

### ⚠️ Required Fields for Boat Registration:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `driverId` | String | Driver MongoDB _id | "driver_mongodb_id" |
| `boatTypeId` | String | Boat type _id from GET /api/boats | "boat_type_mongodb_id" |
| `boatNumber` | String | Government registration number | "UP-12345" |
| `state` | String | State name | "Uttar Pradesh" |
| `city` | String | City name | "Varanasi" |
| `zoneId` | String | Must match driver's zone | "6937cedef793c336a703fa71" |
| `ghatId` | String | Optional - Ghat MongoDB _id | "ghat_mongodb_id" |
| `boatRegistrationPaper` | File | Boat registration document | `<file>` |

---

## 📊 Complete Flow Summary

```
1. POST /api/driver-auth/send-otp
   → Enter mobile number
   ↓
2. POST /api/driver-auth/verify-otp
   → Verify OTP, get driver _id
   ↓
3. GET /api/zones
   → Get zones list, select zone
   ↓
4. POST /api/driver-profile/complete
   → Submit profile with documents
   → Status: Pending
   ↓
5. GET /api/boats
   → Get boat types, select boat type
   ↓
6. GET /api/ghats/zone/:zoneId (optional)
   → Get ghats for selected zone
   ↓
7. POST /api/driver-boat/register
   → Register boat
   → Status: Pending
   ↓
8. Admin Approves → PUT /api/drivers/:id/approve
   → Driver status: Approved
   → Driver can login
```

---

## 🔑 Important Points

### 1. **Zone ID Usage:**
- Use `zone._id` (MongoDB ObjectId) from `GET /api/zones`
- NOT `zone.zoneId` (string like "ZONE-001")
- Example: `"6937cedef793c336a703fa71"` ✅
- NOT: `"ZONE-001"` ❌

### 2. **File Upload:**
- Use `multipart/form-data` content type
- Files automatically saved in `uploads/drivers/` or `uploads/boats/`
- File paths returned in response

### 3. **Status Flow:**
- After profile: `status: "Pending"`
- After boat registration: `status: "Pending"`
- After admin approval: `status: "Approved"`, `isActive: true`

### 4. **Zone Validation:**
- Driver's `zoneId` and Boat's `zoneId` must match
- Boat must be in same zone as driver

### 5. **OTP for Testing:**
- Use `"123456"` as OTP (dummy OTP for development)

---

## 📝 Example: Complete Registration (JavaScript/React Native)

```javascript
// Step 1: Send OTP
const sendOTP = async (mobileNo) => {
  const response = await axios.post('http://localhost:5000/api/driver-auth/send-otp', {
    mobileNo: mobileNo
  });
  return response.data;
};

// Step 2: Verify OTP
const verifyOTP = async (mobileNo, otp) => {
  const response = await axios.post('http://localhost:5000/api/driver-auth/verify-otp', {
    mobileNo: mobileNo,
    otp: otp
  });
  return response.data; // Returns driver _id
};

// Step 3: Get Zones
const getZones = async () => {
  const response = await axios.get('http://localhost:5000/api/zones');
  return response.data;
};

// Step 4: Complete Profile
const completeProfile = async (driverData, files) => {
  const formData = new FormData();
  
  // Add text fields
  formData.append('firstName', driverData.firstName);
  formData.append('lastName', driverData.lastName);
  formData.append('address', driverData.address);
  formData.append('mobileNo', driverData.mobileNo);
  formData.append('password', driverData.password);
  formData.append('zoneId', driverData.zoneId); // MongoDB _id
  
  // Add files
  formData.append('aadharCard', {
    uri: files.aadharCard.uri,
    type: 'image/jpeg',
    name: 'aadharCard.jpg'
  });
  formData.append('panCard', {
    uri: files.panCard.uri,
    type: 'image/jpeg',
    name: 'panCard.jpg'
  });
  formData.append('boatDrivingLicense', {
    uri: files.boatDrivingLicense.uri,
    type: 'image/jpeg',
    name: 'boatDrivingLicense.jpg'
  });
  
  const response = await axios.post(
    'http://localhost:5000/api/driver-profile/complete',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  return response.data;
};

// Step 5: Get Boat Types
const getBoatTypes = async () => {
  const response = await axios.get('http://localhost:5000/api/boats');
  return response.data;
};

// Step 6: Register Boat
const registerBoat = async (boatData, file) => {
  const formData = new FormData();
  
  formData.append('driverId', boatData.driverId);
  formData.append('boatTypeId', boatData.boatTypeId);
  formData.append('boatNumber', boatData.boatNumber);
  formData.append('state', boatData.state);
  formData.append('city', boatData.city);
  formData.append('zoneId', boatData.zoneId);
  if (boatData.ghatId) {
    formData.append('ghatId', boatData.ghatId);
  }
  formData.append('boatRegistrationPaper', {
    uri: file.uri,
    type: 'application/pdf',
    name: 'boatRegistrationPaper.pdf'
  });
  
  const response = await axios.post(
    'http://localhost:5000/api/driver-boat/register',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }
  );
  return response.data;
};
```

---

## ✅ Success Response After Complete Registration

After both steps complete:
- Driver status: `"Pending"`
- Boat status: `"Pending"`
- Driver waits for admin approval
- Admin approves via: `PUT /api/drivers/:id/approve`
- After approval: Driver can login and use app

---

## 🚨 Common Errors

### 1. Missing Required Field
```json
{
  "message": "All fields are required: firstName, lastName, address, mobileNo, password, zoneId"
}
```
**Fix:** Check all required fields are sent

### 2. Zone Not Found
```json
{
  "message": "Zone not found"
}
```
**Fix:** Use correct MongoDB `_id` from `GET /api/zones`, not `zoneId` string

### 3. Mobile Number Already Registered
```json
{
  "message": "Mobile number already registered"
}
```
**Fix:** Use different mobile number or login with existing account

### 4. Zone Mismatch
```json
{
  "message": "Boat zone must match driver zone"
}
```
**Fix:** Ensure boat's `zoneId` matches driver's `zoneId`

---

## 📞 API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/driver-auth/send-otp` | POST | No | Send OTP |
| `/api/driver-auth/verify-otp` | POST | No | Verify OTP |
| `/api/zones` | GET | No | Get zones list |
| `/api/driver-profile/complete` | POST | Optional | Complete profile |
| `/api/boats` | GET | No | Get boat types |
| `/api/ghats/zone/:zoneId` | GET | No | Get ghats by zone |
| `/api/driver-boat/register` | POST | Optional | Register boat |

---

**Note:** All file uploads use `multipart/form-data`. Use FormData object in JavaScript/React Native.

