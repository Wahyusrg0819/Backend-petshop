// File: C:/Users/HP/PROJECT DPM/Backend/routes/login.js
// backend/routes/login.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Untuk hashing password
const db = require('../config/db'); // Pastikan untuk mengimpor koneksi database
const dotenv = require('dotenv'); // Memuat variabel dari file .env
const router = express.Router();

// Memuat variabel lingkungan dari file .env
dotenv.config();

// Route untuk login (POST /api/login)
router.post('/login', (req, res) => {
  console.log('Route /login accessed');
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
  }

  const query = 'SELECT user_id, name, username, email, password, role FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
      }

      console.log('Query results:', results); // Tambahkan log untuk memeriksa hasil query

      if (results.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
              console.error('Password comparison error:', err);
              return res.status(500).json({ message: 'Password comparison error', error: err.message });
          }

          if (!isMatch) {
              return res.status(401).json({ message: 'Invalid credentials' });
          }

          // Buat token JWT
          const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '30d' });

          // Sertakan role dan user_id dalam respons
          res.status(200).json({
            message: 'Login successful',
            accessToken: token,
            role: user.role,
            user: {
                user_id: user.user_id,
                email: user.email,
                name: user.name
            }
        });
        
      });
  });
});


module.exports = router;
