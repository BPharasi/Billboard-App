const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const adminEmail = process.env.ADMIN_MOCK_EMAIL || 'admin@local';
const plainPassword = process.env.ADMIN_MOCK_PASSWORD || 'password';
const hashed = bcrypt.hashSync(plainPassword, 10);

const mockAdmin = {
	_id: uuidv4(),
	email: adminEmail,
	password: hashed,
	// any other fields your app expects
};

class AdminMock {
	static async findOne(filter = {}) {
		if (filter.email && filter.email === mockAdmin.email) {
			return mockAdmin;
		}
		return null;
	}
}

module.exports = AdminMock;
