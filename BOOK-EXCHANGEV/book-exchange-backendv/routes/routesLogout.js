// routes/routesLogout.js
const express = require('express');
const router = express.Router();

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {  // This assumes you're using sessions
        if (err) {
            return res.status(500).json({ message: 'Failed to log out' });
        }
        res.clearCookie('connect.sid');  // Clears the session cookie
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;

