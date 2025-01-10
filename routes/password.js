// File: C:/Users/HP/PROJECT DPM/Backend/routes/password.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Sesuaikan dengan file koneksi database

// Fungsi untuk generate OTP 4 digit
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Menghasilkan angka acak 4 digit
};

// Endpoint lupa password (menggunakan OTP)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Cek apakah email terdaftar
    const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user.length) return res.status(404).json({ message: 'Email tidak ditemukan' });

    // Generate OTP 4 digit
    const otp = generateOTP();
    const expireTime = new Date(Date.now() + 5 * 60 * 1000); // OTP berlaku selama 5 menit

    // Simpan OTP dan waktu kadaluarsa di database
    await db.promise().query('UPDATE users SET reset_token = ?, reset_token_expire = ? WHERE email = ?', [otp, expireTime, email]);

    // Kirim email berisi OTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password - OTP Code',
      text: `Your OTP code for resetting your password is: ${otp}. It is valid for 5 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP telah dikirim ke email Anda.' });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Terjadi kesalahan, coba lagi.' });
  }
});

// Endpoint verifikasi OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      // Cek apakah OTP valid dan belum kadaluarsa
      const [user] = await db.promise().query(
        'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expire > ?',
        [email, otp, new Date()]
      );
  
      if (!user.length) {
        return res.status(400).json({ message: 'OTP invalid atau sudah kadaluarsa' });
      }
  
      // Tandai OTP sebagai diverifikasi (tanpa menghapus reset_token)
      await db.promise().query(
        'UPDATE users SET otp_verified = 1 WHERE email = ?',
        [email]
      );
  
      res.json({ message: 'OTP berhasil diverifikasi.' });
    } catch (error) {
      console.error('Error in verify-otp:', error);
      res.status(500).json({ message: 'Terjadi kesalahan, coba lagi.' });
    }
  });
  

// Endpoint reset password
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
  
    try {
      // Validasi email, OTP, dan status verifikasi
      const [user] = await db.promise().query(
        'SELECT * FROM users WHERE email = ? AND reset_token = ? AND otp_verified = 1 AND reset_token_expire > ?',
        [email, otp, new Date()]
      );
  
      if (!user.length) {
        return res.status(400).json({ message: 'OTP belum diverifikasi atau sudah kadaluarsa.' });
      }
  
      // Validasi password baru
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password minimal 6 karakter.' });
      }
  
      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update password baru dan hapus OTP (opsional)
      await db.promise().query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expire = NULL, otp_verified = 0 WHERE email = ?',
        [hashedPassword, email]
      );
  
      res.json({ message: 'Password berhasil diubah.' });
    } catch (error) {
      console.error('Error in reset-password:', error);
      res.status(500).json({ message: 'Terjadi kesalahan, coba lagi.' });
    }
  });
  

// Endpoint untuk mengubah password
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    // Validasi input
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Mohon lengkapi semua field yang diperlukan' 
      });
    }

    // Validasi panjang password baru
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password baru harus memiliki minimal 6 karakter' 
      });
    }

    // Cari user berdasarkan ID
    const [user] = await db.promise().query(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user.length) {
      return res.status(404).json({ 
        message: 'User tidak ditemukan' 
      });
    }

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user[0].password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Password saat ini salah' 
      });
    }

    // Hash password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password di database
    await db.promise().query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [hashedNewPassword, userId]
    );

    res.json({ 
      message: 'Password berhasil diubah' 
    });
  } catch (error) {
    console.error('Error in change-password:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan saat mengubah password' 
    });
  }
});

module.exports = router;