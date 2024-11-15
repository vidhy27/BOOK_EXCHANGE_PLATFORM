const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Set up your PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'book_exchange',
    password: 'Goodluck#27', // replace with your actual password
    port: 5432,
});

// Route to get books from other users (not the current user)
router.get('/books/other-users/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query('SELECT * FROM books WHERE user_id != $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No books found for other users.' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add any additional routes related to book exchanges here

module.exports = router;

