const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Endpoint untuk mengubah email
router.post('/change-email', async (req, res) => {
  const { userId, password, newEmail } = req.body;

  try {
    // Validasi input
    if (!userId || !password || !newEmail) {
      return res.status(400).json({ 
        message: 'Mohon lengkapi semua field yang diperlukan' 
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ 
        message: 'Format email tidak valid' 
      });
    }

    // Cek apakah email baru sudah digunakan
    const [existingEmail] = await db.promise().query(
      'SELECT * FROM users WHERE email = ? AND user_id != ?',
      [newEmail, userId]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ 
        message: 'Email sudah digunakan' 
      });
    }

    // Cari user dan verifikasi password
    const [user] = await db.promise().query(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user.length) {
      return res.status(404).json({ 
        message: 'User tidak ditemukan' 
      });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(
      password,
      user[0].password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Password yang dimasukkan salah' 
      });
    }

    // Update email
    await db.promise().query(
      'UPDATE users SET email = ? WHERE user_id = ?',
      [newEmail, userId]
    );

    res.json({ 
      message: 'Email berhasil diubah',
      newEmail: newEmail
    });
  } catch (error) {
    console.error('Error in change-email:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan saat mengubah email' 
    });
  }
});

module.exports = router;
