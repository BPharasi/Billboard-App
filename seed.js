const Billboard = require('./models/Billboard');

async function seedBillboards() {
    const billboards = [
        {
            name: 'Sandton Billboard 1',
            location: { lat: -26.1046, lng: 28.0526, address: 'Sandton, Johannesburg' },
            size: 'Large',
            price: Math.floor(Math.random() * (20000 - 5000) + 5000),
            imageUrl: 'https://example.com/sandton1.jpg',
            isVisible: true,
            description: 'Prime location in Sandton for high visibility.'
        },
        {
            name: 'Soweto Billboard 1',
            location: { lat: -26.2485, lng: 27.8546, address: 'Soweto, Johannesburg' },
            size: 'Medium',
            price: Math.floor(Math.random() * (20000 - 5000) + 5000),
            imageUrl: 'https://example.com/soweto1.jpg',
            isVisible: true,
            description: 'Community-focused billboard in Soweto.'
        },
        {
            name: 'Rosebank Billboard 1',
            location: { lat: -26.1466, lng: 28.0416, address: 'Rosebank, Johannesburg' },
            size: 'Large',
            price: Math.floor(Math.random() * (20000 - 5000) + 5000),
            imageUrl: 'https://example.com/rosebank1.jpg',
            isVisible: true,
            description: 'Upscale area billboard in Rosebank.'
        },
        {
            name: 'Midrand Billboard 1',
            location: { lat: -25.9636, lng: 28.1378, address: 'Midrand, Johannesburg' },
            size: 'Medium',
            price: Math.floor(Math.random() * (20000 - 5000) + 5000),
            imageUrl: 'https://example.com/midrand1.jpg',
            isVisible: true,
            description: 'Business district billboard in Midrand.'
        },
        {
            name: 'Braamfontein Billboard 1',
            location: { lat: -26.1929, lng: 28.0357, address: 'Braamfontein, Johannesburg' },
            size: 'Large',
            price: Math.floor(Math.random() * (20000 - 5000) + 5000),
            imageUrl: 'https://example.com/braamfontein1.jpg',
            isVisible: true,
            description: 'Central location billboard in Braamfontein.'
        },
        {
            name: 'R24 Airport Gateway',
            location: {
                address: 'R24 Highway, OR Tambo International Airport Precinct, Johannesburg',
                lat: -26.1367,
                lng: 28.2411
            },
            size: 'X-Large',
            price: 45000,
            imageUrl: 'https://example.com/r24airport.jpg',
            isVisible: true,
            description: 'Prime location on R24 highway near OR Tambo International Airport entrance. High visibility for international and domestic travelers.'
        }
    ];

    try {
        await Billboard.insertMany(billboards);
        console.log('Sample billboards seeded');
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

module.exports = seedBillboards;
