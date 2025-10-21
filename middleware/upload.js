const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
		destination: function (req, file, cb) {
				cb(null, path.join(process.cwd(), 'uploads'));
		},
		filename: function (req, file, cb) {
				const uniqueName = `${Date.now()}-${file.originalname}`;
				cb(null, uniqueName);
		},
});

const fileFilter = (req, file, cb) => {
		if (file.mimetype && file.mimetype.startsWith('image/')) {
				cb(null, true);
		} else {
				cb(new Error('Invalid image'), false);
		}
};

const upload = multer({
		storage,
		limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
		fileFilter,
});

module.exports = upload;