const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const upload = require('./middleware/upload');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

const Billboard = require('./models/Billboard');
const Admin = require('./models/Admin');
const connectDB = require('./db');
const seedBillboards = require('./seed');

dotenv.config();

const app = express();
const PORT = 5000;
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

// MongoDB connection and seeding
connectDB().then(async () => {
    const count = await Billboard.countDocuments();
    if (count === 0) {
        await seedBillboards();
    }
});

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
												// ignore if file does not exist, log other errors
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
                // remove leading slash if present
                const oldRelative = billboard.imagePath.replace(/^\//, '');
                const oldPath = path.join(process.cwd(), oldRelative);
                await fs.unlink(oldPath);
            } catch (unlinkErr) {
                // ignore file-not-found but log others
                if (unlinkErr.code !== 'ENOENT') {
                    console.error('Failed to delete image on billboard delete:', unlinkErr);
                }
            }
        }

        await billboard.remove();
        return res.json({ message: 'Billboard deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Multer / upload errors handler (must be after routes)
app.use((err, req, res, next) => {
	// Multer file too large error
	if (err && (err.code === 'LIMIT_FILE_SIZE' || err.message === 'File too large')) {
		return res.status(413).json({ error: 'File too large' });
	}
	// Multer fileFilter invalid image
	if (err && err.message === 'Invalid image') {
		return res.status(400).json({ error: 'Invalid image' });
	}
	// pass-through other errors
	console.error('Unhandled error:', err);
	next(err);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
