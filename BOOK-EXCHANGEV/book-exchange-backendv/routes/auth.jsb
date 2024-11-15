// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const twilio = require('twilio');

// Twilio configuration
const accountSid = 'AC3eb1eb04a7e6af4461661ee4d5c5ecc7';
const authToken = '5b19546f34a27c7a9dfa2eb79ab366dd';
const client = twilio(accountSid, authToken);

const OTP_EXPIRY_TIME = 300000; // 5 minutes in milliseconds

// Generate OTP and send via WhatsApp
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const userCheck = await pool.query('SELECT * FROM users_bookexchange WHERE email = $1', [email]);
        const user = userCheck.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiry = Date.now() + OTP_EXPIRY_TIME;
        
        await pool.query('UPDATE users_bookexchange SET otp = $1, otp_expiry = $2 WHERE email = $3', [otp, expiry, email]);

        await client.messages.create({
            from: 'whatsapp:+14155238886',
            body: `Your OTP for password reset is ${otp}. It expires in 5 minutes.`,
            to: `whatsapp:${user.phone_number}` // Add 'phone_number' in your database for storing user contact.
        });

        res.status(200).json({ message: 'OTP sent via WhatsApp' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify OTP and reset password
router.post('/verify-otp', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const userCheck = await pool.query('SELECT * FROM users_bookexchange WHERE email = $1', [email]);
        const user = userCheck.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'Email not found' });
        }

        if (user.otp !== otp || Date.now() > user.otp_expiry) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users_bookexchange SET password = $1, otp = null, otp_expiry = null WHERE email = $2', [hashedPassword, email]);

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

