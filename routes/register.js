// File: C:/Users/HP/PROJECT DPM/Backend/routes/register.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require('dotenv');
const router = express.Router();

dotenv.config();

router.post('/register', async (req, res) => {
    const { name, email, password, role, phone, address, profilePicture } = req.body;

    console.log('Received Data:', req.body);

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields: name, email, and password' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            `INSERT INTO users (name, email, password, role, phone, address, profilePicture, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [name, email, hashedPassword, role || 'customer', phone || '', address || '', profilePicture || 'default.png'],
            (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Database error', error: err.message });
                }
                res.status(201).json({ message: 'User created successfully', userId: results.insertId });
            }
        );
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
});

module.exports = router; // Ini harus benar