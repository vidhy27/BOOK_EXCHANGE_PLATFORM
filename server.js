require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const morgan = require('morgan');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/auth');
const routesExchange = require('./routes/routesExchange');
const routesLogout = require('./routes/routesLogout');

const app = express();
const PORT = 5001;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'book_exchange',
    password: 'Goodluck#27',
    port: 5432,
});

app.use(morgan('combined'));  // Logs HTTP requests

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,  // Allow credentials (cookies, etc.)
}));

app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Authentication routes
app.use('/auth', authRoutes);  // Ensure this matches the routes in auth.js

// Book routes
app.use('/api', bookRoutes);

// Connect to PostgreSQL
pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => {
        console.error('Connection error', err.stack);
        process.exit(1);
    });

// Book exchange routes (added from routesExchange.js)
app.use('/api',routesExchange ); 

// Use the authentication routes
app.use('/auth', routesLogout);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unexpected error occurred: ', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

