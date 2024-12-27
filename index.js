require('dotenv').config(); // Load environment variables
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const Otp = require('./models/otp');

// MongoDB connection URI from environment variable
const uri = process.env.MONGODB_URI;

// Check if uri is loaded properly
if (!uri) {
    console.error('MongoDB URI is not defined!');
    process.exit(1); // Exit the process if the URI is missing
}

mongoose.connect(uri)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB Atlas:', err);
    });

// Use express.json() middleware to parse JSON request bodies
app.use(express.json());

// Serve static files (HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Function to generate a random 6-digit OTP
function generateOTP() {
    const otp = crypto.randomInt(100000, 999999); // generates a number between 100000 and 999999
    console.log('Generated OTP:', otp);
    return otp;
}

app.post('/send-otp', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP and email in the database
    const otpRecord = new Otp({
        email: email,
        otp: otp,
    });

    otpRecord.save()
        .then(() => {
            // Use Nodemailer to send OTP to the user's email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL, // Your email
                    pass: process.env.EMAIL_PASSWORD // Your email password (or app password)
                }
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'OTP Verification',
                text: `Your OTP is: ${otp}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({ success: false, message: 'Error sending email' });
                }

                // Send a success response with a redirect instruction
                res.json({ success: true, message: 'OTP sent to your email!', redirect: '/otp_validation.html' });
            });
        })
        .catch(err => {
            res.status(500).json({ success: false, message: 'Error saving OTP to database' });
        });
});




// POST route for verifying OTP
app.post('/verify-otp', async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    // Find the OTP record in the database
    const otpRecord = await Otp.findOne({ otp });

    if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'Invalid OTP or OTP has expired' });
    }

    res.json({ success: true, message: 'OTP verified successfully!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
