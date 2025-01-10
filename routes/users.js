// File: C:/Users/HP/PROJECT DPM/Backend/routes/users.js
// backend/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');  // Koneksi ke database
const router = express.Router();

// Endpoint untuk menambahkan pengguna baru
router.post('/', (req, res) => {
    const { name, email, password, role, phone, address } = req.body;

    // Validasi input
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Hash password menggunakan bcrypt
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Query untuk memasukkan pengguna baru
    const query = `INSERT INTO users (name, email, password, role, phone, address) 
                   VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(query, [name, email, hashedPassword, role, phone, address], (err, results) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.status(201).json({ message: 'User created successfully', userId: results.insertId });
    });
});

module.exports = router;
