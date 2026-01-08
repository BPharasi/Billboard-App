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

const rentalSchema = new mongoose.Schema({
  billboard: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Billboard', 
    required: true 
  },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientPhone: String,
  clientCompany: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  contractDuration: { type: Number, required: true },
  monthlyRate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  contractPDF: String,
  status: { 
    type: String, 
    enum: ['active', 'expired', 'upcoming', 'cancelled'],
    default: 'active'
  },
  remindersSent: [{
    type: { type: String },
    sentAt: { type: Date, default: Date.now }
  }],
  notes: String
}, { timestamps: true });

// Virtual fields
rentalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

rentalSchema.virtual('monthsRemaining').get(function() {
  return Math.ceil(this.daysRemaining / 30);
});

rentalSchema.methods.getPendingReminders = function() {
  const daysLeft = this.daysRemaining;
  const monthsLeft = this.monthsRemaining;
  const duration = this.contractDuration;
  const sentTypes = this.remindersSent.map(r => r.type);
  const pending = [];

  const wasReminderSent = (type) => sentTypes.includes(type);

  if (duration === 1) {
    if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) {
      pending.push({ type: '1_week', daysLeft });
    }
  } else if (duration === 3) {
    if (monthsLeft === 2 && !wasReminderSent('2_months')) pending.push({ type: '2_months', daysLeft });
    if (monthsLeft === 1 && !wasReminderSent('1_month')) pending.push({ type: '1_month', daysLeft });
    if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) pending.push({ type: '1_week', daysLeft });
  } else if (duration === 6) {
    if (monthsLeft === 3 && !wasReminderSent('3_months')) pending.push({ type: '3_months', daysLeft });
    if (monthsLeft === 2 && !wasReminderSent('2_months')) pending.push({ type: '2_months', daysLeft });
    if (monthsLeft === 1 && !wasReminderSent('1_month')) pending.push({ type: '1_month', daysLeft });
    if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) pending.push({ type: '1_week', daysLeft });
  } else if (duration === 12) {
    if (monthsLeft === 6 && !wasReminderSent('6_months')) pending.push({ type: '6_months', daysLeft });
    if (monthsLeft === 3 && !wasReminderSent('3_months')) pending.push({ type: '3_months', daysLeft });
    if (monthsLeft === 2 && !wasReminderSent('2_months')) pending.push({ type: '2_months', daysLeft });
    if (monthsLeft === 1 && !wasReminderSent('1_month')) pending.push({ type: '1_month', daysLeft });
    if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) pending.push({ type: '1_week', daysLeft });
  } else if (duration === 24) {
    if (monthsLeft === 12 && !wasReminderSent('12_months')) pending.push({ type: '12_months', daysLeft });
    if (monthsLeft === 6 && !wasReminderSent('6_months')) pending.push({ type: '6_months', daysLeft });
    if (monthsLeft === 3 && !wasReminderSent('3_months')) pending.push({ type: '3_months', daysLeft });
    if (monthsLeft === 2 && !wasReminderSent('2_months')) pending.push({ type: '2_months', daysLeft });
    if (monthsLeft === 1 && !wasReminderSent('1_month')) pending.push({ type: '1_month', daysLeft });
    if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) pending.push({ type: '1_week', daysLeft });
  } else if (duration === 60) {
    if (monthsLeft === 48 && !wasReminderSent('48_months')) pending.push({ type: '48_months', daysLeft });
    if (monthsLeft === 36 && !wasReminderSent('36_months')) pending.push({ type: '36_months', daysLeft });
    if (monthsLeft === 24 && !wasReminderSent('24_months')) pending.push({ type: '24_months', daysLeft });
    if (monthsLeft === 12 && !wasReminderSent('12_months')) pending.push({ type: '12_months', daysLeft });
    if (monthsLeft === 6 && !wasReminderSent('6_months')) pending.push({ type: '6_months', daysLeft });
    if (monthsLeft === 3 && !wasReminderSent('3_months')) pending.push({ type: '3_months', daysLeft });
    if (monthsLeft === 2 && !wasReminderSent('2_months')) pending.push({ type: '2_months', daysLeft });
    if (monthsLeft === 1 && !wasReminderSent('1_month')) pending.push({ type: '1_month', daysLeft });
    if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) pending.push({ type: '1_week', daysLeft });
  }

  return pending;
};

rentalSchema.methods.markReminderSent = function(reminderType) {
  this.remindersSent.push({ type: reminderType });
  return this.save();
};

rentalSchema.set('toJSON', { virtuals: true });
rentalSchema.set('toObject', { virtuals: true });

const Billboard = mongoose.models.Billboard || mongoose.model('Billboard', billboardSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Rental = mongoose.models.Rental || mongoose.model('Rental', rentalSchema);

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

// Rental Management Routes
app.get('/api/admin/rentals', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const rentals = await Rental.find().populate('billboard').sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    console.error('Error fetching rentals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/rentals', verifyToken, upload.single('contractPDF'), async (req, res) => {
  try {
    await connectDB();
    
    const rentalData = {
      billboard: req.body.billboard,
      clientName: req.body.clientName,
      clientEmail: req.body.clientEmail,
      clientPhone: req.body.clientPhone || '',
      clientCompany: req.body.clientCompany || '',
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      contractDuration: req.body.contractDuration,
      monthlyRate: req.body.monthlyRate,
      totalAmount: req.body.totalAmount,
      status: req.body.status || 'active',
      notes: req.body.notes || ''
    };

    if (req.file) {
      rentalData.contractPDF = req.file.path;
    }

    const rental = new Rental(rentalData);
    await rental.save();
    
    const populatedRental = await Rental.findById(rental._id).populate('billboard');
    res.json(populatedRental);
  } catch (err) {
    console.error('Error creating rental:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.put('/api/admin/rentals/:id', verifyToken, upload.single('contractPDF'), async (req, res) => {
  try {
    await connectDB();
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        rental[key] = req.body[key];
      }
    });

    if (req.file) {
      rental.contractPDF = req.file.path;
    }

    await rental.save();
    const populatedRental = await Rental.findById(rental._id).populate('billboard');
    res.json(populatedRental);
  } catch (e) {
    console.error('Error updating rental:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/rentals/:id', verifyToken, async (req, res) => {
  try {
    await connectDB();
    await Rental.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rental deleted' });
  } catch (err) {
    console.error('Error deleting rental:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to send rental reminder email
async function sendRentalReminder(rental, reminderType) {
  if (!transporter) {
    console.log('⚠️ Email service not configured for reminders');
    return;
  }

  const reminderDisplay = reminderType
    .replace('_', ' ')
    .replace('months', 'months left')
    .replace('month', 'month left')
    .replace('week', 'week left');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.CONTACT_EMAIL || 'info@hermpo.com',
    subject: `🔔 Rental Expiring: ${rental.billboard?.name || 'Billboard'} - ${reminderDisplay}`,
    html: `
      <h2>🔔 Rental Contract Expiration Reminder</h2>
      <p><strong>Alert:</strong> ${reminderDisplay.toUpperCase()}</p>
      <hr>
      <h3>Billboard Details:</h3>
      <p><strong>Name:</strong> ${rental.billboard?.name || 'N/A'}</p>
      <p><strong>Location:</strong> ${rental.billboard?.location?.address || 'N/A'}</p>
      <p><strong>Size:</strong> ${rental.billboard?.size || 'N/A'}</p>
      <p><strong>Type:</strong> ${rental.billboard?.type || 'N/A'}</p>
      
      <h3>Client Information:</h3>
      <p><strong>Name:</strong> ${rental.clientName}</p>
      <p><strong>Email:</strong> ${rental.clientEmail}</p>
      ${rental.clientPhone ? `<p><strong>Phone:</strong> ${rental.clientPhone}</p>` : ''}
      ${rental.clientCompany ? `<p><strong>Company:</strong> ${rental.clientCompany}</p>` : ''}
      
      <h3>Contract Details:</h3>
      <p><strong>Start Date:</strong> ${new Date(rental.startDate).toLocaleDateString()}</p>
      <p><strong>End Date:</strong> ${new Date(rental.endDate).toLocaleDateString()}</p>
      <p><strong>Duration:</strong> ${rental.contractDuration} months</p>
      <p><strong>Days Remaining:</strong> <span style="color: ${rental.daysRemaining <= 7 ? 'red' : 'orange'}; font-weight: bold;">${rental.daysRemaining} days</span></p>
      <p><strong>Monthly Rate:</strong> R${rental.monthlyRate.toLocaleString()}</p>
      <p><strong>Total Amount:</strong> R${rental.totalAmount.toLocaleString()}</p>
      
      ${rental.notes ? `
      <h3>Notes:</h3>
      <p>${rental.notes.replace(/\n/g, '<br>')}</p>
      ` : ''}
      
      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an automated reminder. Please contact the client to discuss contract renewal.
      </p>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Check and send rental reminders
app.post('/api/admin/rentals/check-reminders', verifyToken, async (req, res) => {
  try {
    await connectDB();
    const rentals = await Rental.find({ status: 'active' }).populate('billboard');
    const results = { sent: [], pending: [], errors: [] };

    for (const rental of rentals) {
      const pendingReminders = rental.getPendingReminders();
      
      for (const reminder of pendingReminders) {
        try {
          await sendRentalReminder(rental, reminder.type);
          await rental.markReminderSent(reminder.type);
          results.sent.push({
            rentalId: rental._id,
            clientName: rental.clientName,
            billboard: rental.billboard?.name,
            reminderType: reminder.type,
            daysLeft: reminder.daysLeft
          });
          console.log(`✅ Sent ${reminder.type} reminder for ${rental.clientName}`);
        } catch (err) {
          console.error(`Failed to send reminder for rental ${rental._id}:`, err);
          results.errors.push({
            rentalId: rental._id,
            error: err.message
          });
        }
      }
    }

    res.json({
      message: 'Reminder check complete',
      totalSent: results.sent.length,
      totalErrors: results.errors.length,
      results
    });
  } catch (err) {
    console.error('Error checking reminders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// For Vercel, export the Express app
module.exports = app;
