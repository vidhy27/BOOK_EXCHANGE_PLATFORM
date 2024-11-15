// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const twilio = require('twilio');
require('dotenv').config(); // Load environment variables


// Middleware to parse JSON bodies
router.use(express.json());

// Route for user registration
router.post('/register', async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body
    const { username, password, email } = req.body;

    // Basic validation
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if the email already exists
        const emailCheck = await pool.query('SELECT * FROM users_bookexchange WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        const result = await pool.query(
            'INSERT INTO users_bookexchange (username, password, email) VALUES ($1, $2, $3) RETURNING *',
            [username, hashedPassword, email]
        );

        const newUser = result.rows[0];
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Route for user login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if the user exists
        const result = await pool.query('SELECT * FROM users_bookexchange WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user) {
            // Compare the provided password with the stored hashed password
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                // Return structured response
                res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username } });
            } else {
                res.status(401).json({ error: 'Invalid password' });
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route for password reset
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
    }

    try {
        const userCheck = await pool.query('SELECT * FROM users_bookexchange WHERE email = $1', [email]);
        const user = userCheck.rows[0];

        if (user) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query('UPDATE users_bookexchange SET password = $1 WHERE email = $2', [hashedPassword, email]);
            res.status(200).json({ message: 'Password reset successfully' });
        } else {
            res.status(404).json({ error: 'Email not found' });
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get current user ID
router.get('/current-user', async (req, res) => {
    // Assuming you're using some form of authentication (like JWT or sessions)
    // Here we'll just assume you have access to user ID directly (this could come from a token)
    const userId = req.headers['user-id']; // Just for example, adjust according to your auth mechanism

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const result = await pool.query('SELECT id FROM users_bookexchange WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (user) {
            res.status(200).json({ id: user.id });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error retrieving user ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Twilio configuration from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const OTP_EXPIRY_TIME = process.env.OTP_EXPIRY_TIME || 300000; // 5 minutes in milliseconds

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
            to: `whatsapp:${user.phone_number}` // Ensure 'phone_number' exists in your database
        });

        res.status(200).json({ message: 'OTP sent via WhatsApp' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify OTP and reset password
router.post('/verify-reset-otp', async (req, res) => { // Updated route name
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

