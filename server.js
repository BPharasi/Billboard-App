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
app.use(cors());
app.use(helmet());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configure helmet with a permissive dev-friendly CSP (adjust for production)
app.use(
	helmet({
		// keep other helmet protections enabled, but add explicit CSP
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", 'data:'],
				connectSrc: [
					"'self'",
					// allow API from dev server / backend
					'http://localhost:5000',
					'ws://localhost:5000',
					// react dev server
					'http://localhost:3000',
					'ws://localhost:3000',
				],
				// adjust other directives as needed
			},
		},
	})
);

// Serve frontend build in production (optional)
if (process.env.NODE_ENV === 'production') {
	const frontendBuild = path.join(__dirname, 'frontend', 'build');
	app.use(express.static(frontendBuild));
	// SPA fallback
	app.get('*', (req, res, next) => {
		// allow API and uploads to continue to their handlers
		if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
		res.sendFile(path.join(frontendBuild, 'index.html'));
	});
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

	// POST /api/admin/billboards (add new billboard)
	app.post('/api/admin/billboards', verifyToken, (req, res) => {
		upload.single('image')(req, res, async (err) => {
			if (err) {
				return res.status(400).json({ error: 'Invalid image' });
			}
			try {
				const billboard = new Billboard({
					...req.body
				});
				if (req.file) {
					billboard.imagePath = `/uploads/${req.file.filename}`;
				}
				await billboard.save();
				res.json(billboard);
			} catch (e) {
				console.error(e);
				res.status(500).json({ error: 'Server error' });
			}
		});
	});

	// PUT /api/admin/billboards/:id (update billboard)
	app.put('/api/admin/billboards/:id', verifyToken, (req, res) => {
		upload.single('image')(req, res, async (err) => {
			if (err) {
				return res.status(400).json({ error: 'Invalid image' });
			}
			try {
				const { id } = req.params;
				const billboard = await Billboard.findById(id);
				if (!billboard) {
					return res.status(404).json({ error: 'Billboard not found' });
				}

				Object.keys(req.body).forEach(key => {
					if (req.body[key] !== undefined) {
						billboard[key] = req.body[key];
					}
				});

				if (req.file) {
					// Delete old image if present
					if (billboard.imagePath) {
						const oldRelative = billboard.imagePath.replace(/^\//, ''); // remove leading slash
						const oldPath = path.join(process.cwd(), oldRelative);
						try {
							await fs.unlink(oldPath);
						} catch (unlinkErr) {
							if (unlinkErr.code !== 'ENOENT') {
								console.error('Failed to delete old image:', unlinkErr);
							}
						}
					}
					billboard.imagePath = `/uploads/${req.file.filename}`;
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

			// Delete image file if exists
			if (billboard.imagePath) {
				try {
					const oldRelative = billboard.imagePath.replace(/^\//, '');
					const oldPath = path.join(process.cwd(), oldRelative);
					await fs.unlink(oldPath);
				} catch (unlinkErr) {
					if (unlinkErr.code !== 'ENOENT') {
						console.error('Failed to delete image on billboard delete:', unlinkErr);
					}
				}
			}

			// support Mongoose doc remove or static delete
			if (typeof billboard.remove === 'function') {
				await billboard.remove();
			} else if (typeof Billboard.findByIdAndDelete === 'function') {
				await Billboard.findByIdAndDelete(id);
			}
			return res.json({ message: 'Billboard deleted' });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Server error' });
		}
	});

	// Multer / upload errors handler (must be after routes)
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

// Connect once, then optionally seed and start the server
connectDB()
	.then(async () => {
		// real DB connected -> require real models
		Billboard = require('./models/Billboard');
		Admin = require('./models/Admin');

		// register routes using real models
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
		// If user set FALLBACK_TO_MOCK=true, continue with in-memory mocks for development
		if (process.env.FALLBACK_TO_MOCK === 'true') {
			console.warn('FALLBACK_TO_MOCK=true -> starting server with in-memory mock models (development only)');

			Billboard = require('./mock/BillboardMock');
			Admin = require('./mock/AdminMock');

			// register routes using mock models
			registerRoutes();

			// Seed mock with initial data if available
			(async () => {
				try {
					const count = await Billboard.countDocuments();
					if (count === 0 && typeof seedBillboards === 'function') {
						await seedBillboards(Billboard);
					}
				} catch (seedErr) {
					console.error('Mock seeding error (non-fatal):', seedErr);
				}
			})();

			app.listen(PORT, () => {
				console.log(`Server running on port ${PORT} (using in-memory mock DB)`);
			});
			return;
		}

		// otherwise exit to allow fix
		process.exit(1);
	});
