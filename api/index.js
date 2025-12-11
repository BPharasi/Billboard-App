// Vercel Serverless Function - API Handler
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Environment variables from Vercel
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(express.json());
app.use(cors());

// Connection cache for Vercel
let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  const conn = await mongoose.connect(MONGO_URI);
  cachedDb = conn;
  console.log('✅ MongoDB connected');
  return conn;
}

// Models
const billboardSchema = new mongoose.Schema({
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
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const Billboard = mongoose.models.Billboard || mongoose.model('Billboard', billboardSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

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
    console.error(err);
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

app.put('/api/admin/billboards/:id', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const billboard = await Billboard.findById(id);
    if (!billboard) return res.status(404).json({ error: 'Billboard not found' });

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        billboard[key] = req.body[key];
      }
    });

    await billboard.save();
    res.json(billboard);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/billboards/:id', verifyToken, async (req, res) => {
  try {
    await connectDB();
    await Billboard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Billboard deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Log contact form submission
  console.log('📧 Contact form:', { name, email, subject, message });
  
  res.json({ 
    success: true, 
    message: 'Thank you! We\'ll contact you at ' + email + ' soon.' 
  });
});

// For Vercel, export the Express app
module.exports = app;
