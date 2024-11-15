const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure this is your db instance

// Create a new book listing
router.post('/books', async (req, res) => {
    const { user_id, title, author, genre, location, availability } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO books (user_id, title, author, genre, location, availability) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [user_id, title, author, genre, location, availability]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get all books for a user
router.get('/books/:user_id', async (req, res) => {
    const user_id = parseInt(req.params.user_id, 10);
    if (isNaN(user_id)) {
        return res.status(400).send('Invalid user ID');
    }
    try {
        const result = await db.query('SELECT * FROM books WHERE user_id = $1', [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Update a book listing
router.put('/books/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).send('Invalid book ID');
    }
    const { title, author, genre, location, availability } = req.body;
    try {
        const result = await db.query(
            'UPDATE books SET title = $1, author = $2, genre = $3, location = $4, availability = $5 WHERE id = $6 RETURNING *',
            [title, author, genre, location, availability, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Delete a book listing
router.delete('/books/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).send('Invalid book ID');
    }
    try {
        await db.query('DELETE FROM books WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// New Search Books API
router.get('/books-search', async (req, res) => {
    try {
        const { title, author, genre, location, availability } = req.query;

        // Build the SQL query with optional filters
        let query = `SELECT * FROM books WHERE 1=1`;
        let queryParams = [];

        if (title) {
            query += ` AND title ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${title}%`);
        }
        if (author) {
            query += ` AND author ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${author}%`);
        }
        if (genre) {
            query += ` AND genre ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${genre}%`);
        }
        if (location) {
            query += ` AND location ILIKE $${queryParams.length + 1}`;
            queryParams.push(`%${location}%`);
        }
        if (availability) {
            query += ` AND availability = $${queryParams.length + 1}`;
            queryParams.push(availability);
        }

        // Execute query
        const result = await db.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error executing search query:', err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
