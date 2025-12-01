require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model('Admin', AdminSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@herpimpo.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log('Admin already exists with email:', email);
      console.log('If you want to reset the password, delete the admin from MongoDB and run this script again.');
      process.exit(0);
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      email,
      password: hashedPassword,
    });

    await admin.save();
    console.log('\n✓ Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nYou can now login with these credentials.\n');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
