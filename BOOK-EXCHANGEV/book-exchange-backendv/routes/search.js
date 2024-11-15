const express = require('express');
const pool = require('../db'); // Adjust the path as necessary
const router = express.Router();

// Search books API
router.get('/search', async (req, res) => {
    try {
        const { user_id, title, author, genre, location, availability } = req.query;

        // Constructing the query
        let query = `SELECT * FROM books`;
        let queryConditions = [];
        let queryParams = [];

        // Optionally include user_id if needed for other operations
        if (user_id) {
            queryConditions.push(`user_id = $${queryParams.length + 1}`);
            queryParams.push(user_id);
        }

        // Build query based on other search parameters
        if (title) {
            queryConditions.push(`title ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${title}%`);
        }

        if (author) {
            queryConditions.push(`author ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${author}%`);
        }

        if (genre) {
            queryConditions.push(`genre ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${genre}%`);
        }

        if (location) {
            queryConditions.push(`location ILIKE $${queryParams.length + 1}`);
            queryParams.push(`%${location}%`);
        }

        if (availability) {
            queryConditions.push(`availability = $${queryParams.length + 1}`);
            queryParams.push(availability);
        }

        // If there are conditions, append them to the query
        if (queryConditions.length > 0) {
            query += ` WHERE ` + queryConditions.join(' AND ');
        }

        // Execute query
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing search query:', err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
