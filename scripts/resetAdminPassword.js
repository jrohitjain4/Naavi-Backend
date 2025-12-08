const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

dotenv.config();

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const admin = await Admin.findOne({ email: 'admin@gmail.com' });
    
    if (!admin) {
      console.log('❌ Admin not found. Creating new admin...');
      const newAdmin = new Admin({
        email: 'admin@gmail.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
      });
      await newAdmin.save();
      console.log('✅ Admin created: admin@gmail.com / admin123');
    } else {
      console.log('✅ Admin found. Resetting password...');
      admin.password = 'admin123'; // Will be hashed by pre-save hook
      await admin.save();
      console.log('✅ Admin password reset: admin@gmail.com / admin123');
    }

    // Verify password
    const verifyAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    const isValid = await verifyAdmin.comparePassword('admin123');
    console.log('✅ Password verification:', isValid ? 'PASSED' : 'FAILED');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();

