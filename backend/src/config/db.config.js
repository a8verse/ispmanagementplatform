// backend/src/config/db.config.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    idleTimeout: 60000,      // Close idle connections after 60 seconds (60000 ms)
    enableKeepAlive: true,   // Send keep-alive packets to prevent connection drop
    keepAliveInitialDelay: 0 // Start keep-alive immediately
});

module.exports = pool;