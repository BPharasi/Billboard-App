// Load env first
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const { upload } = require('./config/cloudinary');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { sendContactEmail } = require('./services/emailService');

let Billboard;
let Admin;

const connectDB = require('./db');
const seedBillboards = require('./seed');

// DEBUG: print masked runtime MONGO_URI host (do NOT log credentials)
const runtimeUri = process.env.MONGO_URI || process.env.MONGODB_URI || '';
if (runtimeUri) {
	console.log('Runtime MONGO_URI host preview:', runtimeUri.replace(/\/\/(.*@)/, '//').split('/')[2] || runtimeUri);
} else {
	console.warn('No MONGO_URI found in environment at process start.');
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Trust proxy for Render (fixes rate limiter error)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware
app.use(express.json());

// Single CORS configuration (remove duplicates)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://hp-management.onrender.com']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Simplified helmet for development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// Helper to register routes after Billboard & Admin are available
function registerRoutes() {
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

	// GET /api/admin/billboards (admin, all billboards including hidden) - MUST BE BEFORE /api/billboards
	app.get('/api/admin/billboards', verifyToken, async (req, res) => {
		try {
			console.log('Admin fetching all billboards');
			const billboards = await Billboard.find({});
			console.log('Found', billboards.length, 'billboards');
			res.json(billboards);
		} catch (err) {
			console.error('Error fetching admin billboards:', err);
			res.status(500).json({ message: 'Server error' });
		}
	});

	// GET /api/billboards (guests, only visible billboards)
	app.get('/api/billboards', async (req, res) => {
		try {
			const billboards = await Billboard.find({ isVisible: true });
			console.log('=== SERVER VERSION: 2.1 - Enhanced Logging ===');
			console.log('🔍 Returning billboards count:', billboards.length);
			console.log('🔍 First billboard data:', JSON.stringify(billboards[0] ? {
				_id: billboards[0]._id,
				name: billboards[0].name,
				size: billboards[0].size,
				type: billboards[0].type,
				hasSize: !!billboards[0].size,
				hasType: !!billboards[0].type,
				allFields: Object.keys(billboards[0].toObject())
			} : 'No billboards', null, 2));
			res.json(billboards);
		} catch (err) {
			console.error('❌ Error fetching billboards:', err);
			res.status(500).json({ message: 'Server error' });
		}
	});

	// POST /api/admin/login (JWT auth)
	app.post('/api/admin/login', async (req, res) => {
		try {
			const { email, password } = req.body;
			console.log('\n=== Login Attempt ===');
			console.log('Email received:', email);
			console.log('Password received:', password ? '***' + password.substring(password.length - 3) : 'empty');
			console.log('Admin model type:', Admin.constructor.name);
			
			const admin = await Admin.findOne({ email });
			if (!admin) {
				console.log('❌ Admin not found for email:', email);
				return res.status(401).json({ message: 'Invalid credentials' });
			}

			console.log('✓ Admin found');
			console.log('Stored hash (first 20 chars):', admin.password.substring(0, 20) + '...');
			
			const valid = await bcrypt.compare(password, admin.password);
			console.log('Password comparison result:', valid);
			
			if (!valid) {
				console.log('❌ Password comparison failed');
				return res.status(401).json({ message: 'Invalid credentials' });
			}

			const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: '1h' });
			console.log('✓ Login successful, token generated\n');
			res.json({ token });
		} catch (err) {
			console.error('❌ Login error:', err);
			res.status(500).json({ message: 'Server error' });
		}
	});

	// POST /api/admin/billboards (add new billboard)
	app.post('/api/admin/billboards', verifyToken, (req, res) => {
		console.log('\n=== Create Billboard Request ===');
		
		upload.array('images', 5)(req, res, async (err) => {
			if (err) {
				console.error('Upload error:', err.message);
				return res.status(400).json({ error: err.message || 'Invalid image' });
			}
			try {
				const billboardData = { ...req.body };
				
				console.log('Received billboard data:', { 
					name: billboardData.name, 
					price: billboardData.price, 
					size: billboardData.size,
					type: billboardData.type
				});
				
				// Parse location if it's a JSON string
				if (billboardData.location && typeof billboardData.location === 'string') {
					billboardData.location = JSON.parse(billboardData.location);
				}
				
				const billboard = new Billboard(billboardData);
				
				// Handle Cloudinary uploaded images
				if (req.files && req.files.length > 0) {
					// Cloudinary files have .path property with the URL
					billboard.images = req.files.map(file => file.path);
					billboard.imagePath = billboard.images[0];
					console.log('Images uploaded to Cloudinary:', billboard.images);
				}
				
				await billboard.save();
				res.json(billboard);
			} catch (e) {
				console.error('Server error:', e);
				res.status(500).json({ error: 'Server error: ' + e.message });
			}
		});
	});

	// PUT /api/admin/billboards/:id (update billboard)
	app.put('/api/admin/billboards/:id', verifyToken, (req, res) => {
		upload.array('images', 5)(req, res, async (err) => {
			if (err) {
				return res.status(400).json({ error: err.message || 'Invalid image' });
			}
			try {
				const { id } = req.params;
				const billboard = await Billboard.findById(id);
				if (!billboard) {
					return res.status(404).json({ error: 'Billboard not found' });
				}

				console.log('Updating billboard with data:', { 
					name: req.body.name, 
					price: req.body.price, 
					size: req.body.size,
					type: req.body.type,
					allKeys: Object.keys(req.body),
					fullBody: req.body
				});

				// Update fields
				Object.keys(req.body).forEach(key => {
					if (req.body[key] !== undefined && key !== 'location' && key !== 'images') {
						console.log(`Setting billboard.${key} = ${req.body[key]}`);
						billboard[key] = req.body[key];
					}
				});

				// Parse and update location if provided
				if (req.body.location) {
					const location = typeof req.body.location === 'string' 
						? JSON.parse(req.body.location) 
						: req.body.location;
					billboard.location = location;
				}

				// Handle new Cloudinary images if uploaded
				if (req.files && req.files.length > 0) {
					// Delete old images from Cloudinary (optional)
					if (billboard.images && billboard.images.length > 0) {
						const { cloudinary } = require('./config/cloudinary');
						for (const imgUrl of billboard.images) {
							try {
								// Extract public_id from Cloudinary URL
								const publicId = imgUrl.split('/').slice(-2).join('/').split('.')[0];
								await cloudinary.uploader.destroy(publicId);
							} catch (delErr) {
								console.error('Failed to delete old Cloudinary image:', delErr);
							}
						}
					}
					billboard.images = req.files.map(file => file.path);
					billboard.imagePath = billboard.images[0];
				}

				await billboard.save();
				console.log('✅ Billboard saved successfully:', {
					id: billboard._id,
					name: billboard.name,
					size: billboard.size,
					type: billboard.type
				});
				res.json(billboard);
			} catch (e) {
				console.error(e);
				res.status(500).json({ error: 'Server error' });
			}
		});
	});

	// DELETE /api/admin/billboards/:id
	app.delete('/api/admin/billboards/:id', verifyToken, async (req, res) => {
		try {
			const { id } = req.params;
			const billboard = await Billboard.findById(id);
			if (!billboard) {
				return res.status(404).json({ error: 'Billboard not found' });
			}

			// Delete images from Cloudinary
			if (billboard.images && billboard.images.length > 0) {
				const { cloudinary } = require('./config/cloudinary');
				for (const imgUrl of billboard.images) {
					try {
						const publicId = imgUrl.split('/').slice(-2).join('/').split('.')[0];
						await cloudinary.uploader.destroy(publicId);
					} catch (delErr) {
						console.error('Failed to delete Cloudinary image:', delErr);
					}
				}
			}

			await Billboard.findByIdAndDelete(id);
			return res.json({ message: 'Billboard deleted' });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Server error' });
		}
	});

	// POST /api/contact (send contact form email)
	app.post('/api/contact', async (req, res) => {
		try {
			const { name, email, subject, message } = req.body;
			
			console.log('\n=== Contact Form Submission ===');
			console.log('From:', name, '<' + email + '>');
			console.log('Subject:', subject);
			
			if (!name || !email || !subject || !message) {
				return res.status(400).json({ error: 'All fields are required' });
			}

			await sendContactEmail(name, email, subject, message);
			
			console.log('✓ Contact email sent successfully\n');
			res.json({ success: true, message: 'Email sent successfully' });
		} catch (err) {
			console.error('❌ Contact form error:', err.message);
			
			if (err.message.includes('not configured')) {
				res.status(503).json({ 
					error: 'Email service temporarily unavailable. Please email us directly at hermpo12@gmail.com' 
				});
			} else {
				res.status(500).json({ 
					error: 'Failed to send email. Please try again later or contact us at hermpo12@gmail.com' 
				});
			}
		}
	});

	// Error handler
	app.use((err, req, res, next) => {
		if (err && (err.code === 'LIMIT_FILE_SIZE' || err.message === 'File too large')) {
			return res.status(413).json({ error: 'File too large' });
		}
		if (err && err.message === 'Invalid image') {
			return res.status(400).json({ error: 'Invalid image' });
		}
		console.error('Unhandled error:', err);
		next(err);
	});
}

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
	const frontendBuild = path.join(__dirname, 'frontend', 'build');
	const fsSync = require('fs');
	
	console.log('🔍 Checking for frontend build at:', frontendBuild);
	
	if (fsSync.existsSync(frontendBuild)) {
		console.log('✅ Frontend build found, serving static files');
		app.use(express.static(frontendBuild));
	} else {
		console.error('❌ Frontend build NOT found at:', frontendBuild);
		console.error('📁 Current directory:', __dirname);
		console.error('📁 Files in current directory:');
		try {
			const files = fsSync.readdirSync(__dirname);
			files.forEach(file => console.error('  -', file));
		} catch(e) {
			console.error('Could not list files:', e.message);
		}
	}
}

// Connect DB and start
connectDB()
	.then(async () => {
		Billboard = require('./models/Billboard');
		Admin = require('./models/Admin');

		registerRoutes();

		// Serve frontend SPA fallback AFTER routes
		if (process.env.NODE_ENV === 'production') {
			const frontendBuild = path.join(__dirname, 'frontend', 'build');
			app.get('*', (req, res) => {
				res.sendFile(path.join(frontendBuild, 'index.html'));
			});
		}

		try {
			const count = await Billboard.countDocuments();
			if (count === 0) await seedBillboards();
		} catch (seedErr) {
			console.error('Seeding error:', seedErr);
		}

		app.listen(PORT, () => {
			console.log(`✅ Server running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error('MongoDB connection error:', err.message);
		process.exit(1);
	});
