// Vercel Serverless Function - API Handler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();

// Load environment from Vercel
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(express.json());
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));

// Connect to MongoDB (Vercel caches connections)
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    cachedDb = conn;
    console.log('✅ Connected to MongoDB');
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}

// Models
const Billboard = mongoose.model('Billboard', new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  location: {
    lat: Number,
    lng: Number,
    address: { type: String, required: true }
  },
  price: Number,
  imagePath: String,
  images: [String],
  isVisible: { type: Boolean, default: true }
}, { timestamps: true }));

const Admin = mongoose.model('Admin', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

// Auth middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.admin = admin;
    next();
  });
};

// Routes
app.get('/api/billboards', async (req, res) => {
  try {
    await connectDB();
    const billboards = await Billboard.find({ isVisible: true });
    res.json(billboards);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/billboards', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const billboards = await Billboard.find({});
    res.json(billboards);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // For Vercel, just log the message (or integrate SendGrid)
  console.log('📧 Contact form:', { name, email, subject, message });
  
  res.json({ 
    success: true, 
    message: 'Thank you for contacting us. We\'ll respond via email soon!' 
  });
});

// Export for Vercel
module.exports = app;
