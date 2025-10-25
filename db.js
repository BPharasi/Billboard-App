const mongoose = require('mongoose');
let connectionPromise = null;

function maskUri(uri) {
	// remove credentials for logs
	return uri ? uri.replace(/\/\/(.*@)/, '//') : uri;
}

async function connectDB() {
	// return existing promise if connect in progress / done
	if (connectionPromise) return connectionPromise;

	const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
	if (!uri || typeof uri !== 'string' || uri.trim() === '') {
		throw new Error(
			'MONGO_URI is not set. Add MONGO_URI to your .env (e.g. MONGO_URI="mongodb+srv://<user>:<pass>@cluster0.xyz.mongodb.net/dbname")'
		);
	}

	// For diagnostics: capture caller stack (first non-internal line)
	const stack = new Error().stack || '';
	const callerLine = stack.split('\n').slice(2, 6).join(' | ');

	console.log('Attempting MongoDB connect to host(s):', maskUri(uri).split('/')[2] || maskUri(uri));
	console.log('connectDB called from:', callerLine);

	const opts = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		serverSelectionTimeoutMS: 10000,
		tls: uri.startsWith('mongodb+srv://'),
	};

	if (process.env.MONGO_TLS_INSECURE === 'true') {
		console.warn('MONGO_TLS_INSECURE=true -> allowing invalid TLS certificates (debug only)');
		opts.tlsAllowInvalidCertificates = true;
	}

	connectionPromise = (async () => {
		try {
			await mongoose.connect(uri, opts);
			console.log('Connected to MongoDB');
			return mongoose.connection;
		} catch (err) {
			console.error('Unable to connect to MongoDB:', err.message || err);
			console.error('Error name:', err.name);
			if (err.stack) console.error(err.stack.split('\n').slice(0, 6).join('\n'));
			console.error('\nTroubleshooting: check MONGO_URI, Atlas IP whitelist, network / firewall, Node TLS support.');
			// reset promise so subsequent attempts may retry after fix
			connectionPromise = null;
			throw err;
		}
	})();

	return connectionPromise;
}

module.exports = connectDB;
