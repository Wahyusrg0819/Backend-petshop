// File: C:/Users/HP/PROJECT DPM/Backend/config/db.js
// backend/config/db.js
const mysql = require('mysql2');
require('dotenv').config();  // Import dotenv untuk membaca .env

// Buat koneksi ke database MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Cek apakah koneksi berhasil
db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to the database');
    }
});

module.exports = db;