const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove/replace problematic characters
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + sanitized);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    console.log('\n=== File Filter Check ===');
    console.log('Original filename:', file.originalname);
    console.log('MIME type:', file.mimetype);
    console.log('Field name:', file.fieldname);
    
    const ext = path.extname(file.originalname).toLowerCase();
    console.log('Extension:', ext);
    
    // More permissive: accept common image mimetypes and extensions
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    const mimeValid = validMimeTypes.includes(file.mimetype.toLowerCase());
    const extValid = validExtensions.includes(ext);
    
    console.log('MIME valid:', mimeValid);
    console.log('Extension valid:', extValid);
    
    if (mimeValid && extValid) {
      console.log('✓ File accepted\n');
      return cb(null, true);
    }
    
    console.error('✗ File REJECTED');
    console.error('Reason: MIME or extension invalid\n');
    cb(new Error(`Invalid image format. Accepted: JPG, PNG, GIF, WEBP. Got: ${file.mimetype} (${ext})`));
  }
});

module.exports = upload;