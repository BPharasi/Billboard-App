const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
}, { _id: false });

const billboardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: locationSchema, required: true },
    size: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    description: { type: String },
    imagePath: { type: String } // relative path, e.g., '/uploads/billboard-123.jpg'
}, { timestamps: true });

module.exports = mongoose.model('Billboard', billboardSchema);
