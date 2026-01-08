// Vercel Serverless Function - API Handler
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'billboards',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit' }]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

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
  size: String,  // Billboard size (e.g., "6m x 3m")
  type: String,  // Billboard type (e.g., "Digital", "Static", "LED")
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

// Email transporter setup
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('📧 Email service configured');
}

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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/billboards', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    await connectDB();
    const billboardData = { ...req.body };
    
    if (billboardData.location && typeof billboardData.location === 'string') {
      billboardData.location = JSON.parse(billboardData.location);
    }
    
    const billboard = new Billboard(billboardData);
    
    if (req.files && req.files.length > 0) {
      billboard.images = req.files.map(file => file.path);
      billboard.imagePath = billboard.images[0];
    }
    
    await billboard.save();
    res.json(billboard);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

app.put('/api/admin/billboards/:id', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    await connectDB();
    const billboard = await Billboard.findById(req.params.id);
    if (!billboard) return res.status(404).json({ error: 'Billboard not found' });

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'location' && key !== 'images' && key !== '_id') {
        billboard[key] = req.body[key];
      }
    });

    if (req.body.location) {
      billboard.location = typeof req.body.location === 'string' 
        ? JSON.parse(req.body.location) 
        : req.body.location;
    }

    if (req.files && req.files.length > 0) {
      billboard.images = req.files.map(file => file.path);
      billboard.imagePath = billboard.images[0];
    }

    await billboard.save();
    res.json(billboard);
  } catch (e) {
    console.error(e);
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

  console.log('📧 Contact form:', { name, email, subject, message });
  
  // Actually send the email
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.CONTACT_EMAIL || 'hermpo12@gmail.com',
        replyTo: email,
        subject: `Contact Form: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      });
      console.log('✅ Email sent successfully');
      res.json({ success: true, message: 'Thank you! We\'ll contact you soon.' });
    } catch (error) {
      console.error('❌ Email send failed:', error);
      res.status(500).json({ error: 'Failed to send email. Please try emailing us directly at hermpo12@gmail.com' });
    }
  } else {
    console.log('⚠️ Email service not configured');
    res.json({ 
      success: true, 
      message: 'Thank you! We\'ll contact you at ' + email + ' soon.' 
    });
  }
});

// For Vercel, export the Express app
module.exports = app;
