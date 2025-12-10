// Load env first
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const upload = require('./middleware/upload');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { sendContactEmail } = require('./services/emailService');

// Note: do NOT require models here; they'll be set after DB connect or fallback to mocks
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
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env var

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware
app.use(express.json());

// Simple permissive CORS for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Update CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://herpo.com']
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

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
	const frontendBuild = path.join(__dirname, 'frontend', 'build');
	
	// Check if build exists before serving
	const fs = require('fs');
	if (fs.existsSync(frontendBuild)) {
		app.use(express.static(frontendBuild));
		
		// SPA fallback - must be LAST
		app.get('*', (req, res, next) => {
			if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
			res.sendFile(path.join(frontendBuild, 'index.html'));
		});
	} else {
		console.warn('⚠️  Frontend build not found at:', frontendBuild);
		console.warn('⚠️  Serving API only. Run "npm run build" to create frontend build.');
	}
} else {
	// simple root route for dev so GET / doesn't 404
	app.get('/', (req, res) => {
		res.send('Billboard app backend (development). If you run the React dev server, open http://localhost:3000');
	});

	// respond to favicon requests to avoid noisy proxy errors from CRA dev server
	app.get('/favicon.ico', (req, res) => {
		// return no content so the browser stops requesting repeatedly
		res.status(204).end();
	});
}

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
			res.json(billboards);
		} catch (err) {
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
		console.log('Body fields:', Object.keys(req.body));
		console.log('Files count:', req.files?.length || 0);
		
		upload.array('images', 5)(req, res, async (err) => {
			if (err) {
				console.error('Upload error:', err.message);
				return res.status(400).json({ error: err.message || 'Invalid image' });
			}
			try {
				console.log('Files received:', req.files?.length || 0);
				console.log('Body after upload:', req.body);
				
				const billboardData = { ...req.body };
				
				// Parse location if it's a JSON string
				if (billboardData.location && typeof billboardData.location === 'string') {
					try {
						billboardData.location = JSON.parse(billboardData.location);
						console.log('Parsed location:', billboardData.location);
					} catch (e) {
						console.error('Failed to parse location:', e);
					}
				}
				
				const billboard = new Billboard(billboardData);
				
				// Handle multiple images
				if (req.files && req.files.length > 0) {
					billboard.images = req.files.map(file => `/uploads/${file.filename}`);
					billboard.imagePath = billboard.images[0];
					console.log('Images saved:', billboard.images);
				} else {
					console.warn('No files received!');
				}
				
				await billboard.save();
				console.log('Billboard created successfully:', billboard._id);
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

				// Update fields
				Object.keys(req.body).forEach(key => {
					if (req.body[key] !== undefined && key !== 'location' && key !== 'images') {
						billboard[key] = req.body[key];
					}
				});

				// Parse and update location if provided
				if (req.body.location) {
					try {
						const location = typeof req.body.location === 'string' 
							? JSON.parse(req.body.location) 
							: req.body.location;
						billboard.location = location;
					} catch (e) {
						console.error('Failed to parse location:', e);
					}
				}

				// Handle new images if uploaded
				if (req.files && req.files.length > 0) {
					// Delete old images if present
					if (billboard.images && billboard.images.length > 0) {
						for (const imgPath of billboard.images) {
							try {
								const oldRelative = imgPath.replace(/^\//, '');
								const oldPath = path.join(process.cwd(), oldRelative);
								await fs.unlink(oldPath);
							} catch (unlinkErr) {
								if (unlinkErr.code !== 'ENOENT') {
									console.error('Failed to delete old image:', unlinkErr);
								}
							}
						}
					}
					billboard.images = req.files.map(file => `/uploads/${file.filename}`);
					billboard.imagePath = billboard.images[0];
				}

				await billboard.save();
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

			// Delete images if they exist
			if (billboard.images && billboard.images.length > 0) {
				for (const imgPath of billboard.images) {
					try {
						const oldRelative = imgPath.replace(/^\//, '');
						const oldPath = path.join(process.cwd(), oldRelative);
						await fs.unlink(oldPath);
					} catch (unlinkErr) {
						if (unlinkErr.code !== 'ENOENT') {
							console.error('Failed to delete image:', unlinkErr);
						}
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

// Connect DB and start server
connectDB()
	.then(async () => {
		Billboard = require('./models/Billboard');
		Admin = require('./models/Admin');

		registerRoutes();

		try {
			const count = await Billboard.countDocuments();
			if (count === 0) {
				await seedBillboards();
			}
		} catch (seedErr) {
			console.error('Seeding error (non-fatal):', seedErr);
		}

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT} (using real MongoDB)`);
		});
	})
	.catch((err) => {
		console.error('MongoDB connection error (fatal):', err.message || err);
		
		if (process.env.FALLBACK_TO_MOCK === 'true') {
			console.warn('FALLBACK_TO_MOCK=true -> starting server with in-memory mock models');

			Billboard = require('./mock/BillboardMock');
			Admin = require('./mock/AdminMock');

			registerRoutes();

			app.listen(PORT, () => {
				console.log(`Server running on port ${PORT} (using in-memory mock DB)`);
			});
			return;
		}

		process.exit(1);
	});
