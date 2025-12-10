const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    lat: { type: Number, required: false },  // Make optional
    lng: { type: Number, required: false },   // Make optional
    address: { type: String, required: true }
}, { _id: false });

const billboardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    location: { type: locationSchema, required: true },
    price: { type: Number, required: false },  // Make optional
    imagePath: { type: String }, // relative path, e.g., '/uploads/billboard-123.jpg'
    images: [{ type: String }],   // Array of image paths
    isVisible: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Billboard', billboardSchema);
