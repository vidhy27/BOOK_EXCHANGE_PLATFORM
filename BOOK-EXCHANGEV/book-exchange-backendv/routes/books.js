const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path to your db file as necessary

// Search books
router.get('/search', async (req, res) => {
    const { title, author, genre, location } = req.query;

    let query = 'SELECT * FROM books WHERE 1=1'; // Base query
    const values = []; // Parameters for the query

    // Add conditions based on the search fields
    if (title) {
        query += ' AND title ILIKE $1';
        values.push(`%${title}%`);
    }
    if (author) {
        query += ' AND author ILIKE $2';
        values.push(`%${author}%`);
    }
    if (genre) {
        query += ' AND genre ILIKE $3';
        values.push(`%${genre}%`);
    }
    if (location) {
        query += ' AND location ILIKE $4';
        values.push(`%${location}%`);
    }

    try {
        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error("Error retrieving books:", error);
        res.status(500).send("Server Error");
    }
});

// Get books for the logged-in user
router.get('/user-books/:userId', async (req, res) => {
    const { userId } = req.params;

    const query = 'SELECT * FROM books WHERE user_id = $1';
    try {
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error retrieving user books:", error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
