require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const Admin = mongoose.model('Admin', AdminSchema);

    // Delete all existing admins
    const deleteResult = await Admin.deleteMany({});
    console.log(`✓ Deleted ${deleteResult.deletedCount} existing admin(s)`);

    // Prompt for new admin details
    rl.question('Enter new admin email: ', async (email) => {
      rl.question('Enter new admin password: ', async (password) => {
        
        if (!email || !password) {
          console.error('❌ Email and password are required');
          process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newAdmin = new Admin({
          email,
          password: hashedPassword
        });

        await newAdmin.save();
        console.log(`✓ New admin created successfully!`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: [hidden]`);
        
        rl.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
