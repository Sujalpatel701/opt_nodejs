// models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
}, {
    timestamps: true,
});

// Set the TTL (Time To Live) index to 1 minute (60 seconds)
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
