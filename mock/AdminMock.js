const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const adminEmail = process.env.ADMIN_MOCK_EMAIL || 'admin@hpmanagement.com';
const plainPassword = process.env.ADMIN_MOCK_PASSWORD || 'admin123';
const hashed = bcrypt.hashSync(plainPassword, 10);

const mockAdmin = {
	_id: uuidv4(),
	email: adminEmail,
	password: hashed,
};

// Log credentials on startup for development
console.log('\n=== Mock Admin Setup ===');
console.log('Email:', adminEmail);
console.log('Password:', plainPassword);
console.log('Hashed Password (first 20 chars):', hashed.substring(0, 20) + '...');
console.log('Admin ID:', mockAdmin._id);
console.log('Use these credentials to login when using mock DB\n');

class AdminMock {
	static async findOne(filter = {}) {
		console.log('AdminMock.findOne called with filter:', filter);
		if (filter.email && filter.email === mockAdmin.email) {
			console.log('Admin found in mock:', mockAdmin.email);
			return mockAdmin;
		}
		console.log('Admin NOT found in mock for email:', filter.email);
		return null;
	}
}

module.exports = AdminMock;
