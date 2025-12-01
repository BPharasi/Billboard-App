require('dotenv').config();
const bcrypt = require('bcrypt');

console.log('\n=== Environment Check ===');
console.log('FALLBACK_TO_MOCK:', process.env.FALLBACK_TO_MOCK);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('ADMIN_MOCK_EMAIL:', process.env.ADMIN_MOCK_EMAIL || 'admin@herpimpo.com');
console.log('ADMIN_MOCK_PASSWORD:', process.env.ADMIN_MOCK_PASSWORD || 'admin123');

// Test password hashing
const testPassword = process.env.ADMIN_MOCK_PASSWORD || 'admin123';
const hash = bcrypt.hashSync(testPassword, 10);
console.log('\n=== Password Hash Test ===');
console.log('Plain password:', testPassword);
console.log('Generated hash (first 30 chars):', hash.substring(0, 30) + '...');
console.log('Hash comparison test:', bcrypt.compareSync(testPassword, hash));
