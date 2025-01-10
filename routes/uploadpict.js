// File: C:/Users/HP/PROJECT DPM/Backend/routes/uploadpict.js
// backend/routes/uploadpict.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.user = decoded;
    next();
  });
};

// Konfigurasi multer untuk upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: fileFilter
});

// Route untuk upload gambar profil
router.post('/uploadpict', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const userId = req.user.userId;
  const imagePath = `/uploads/profiles/${req.file.filename}`;

  const updateQuery = 'UPDATE users SET profilePicture = ? WHERE user_id = ?';

  db.query(updateQuery, [imagePath, userId], (err, result) => {
    if (err) {
      console.error('Error updating profile picture:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update profile picture' 
      });
    }

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: `http://172.20.10.2:5000${imagePath}` // Ensure no double slashes
    });
    
    
  });
});

// Route untuk mengambil gambar profil
router.get('/profile-picture/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = 'SELECT profilePicture FROM users WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching profile picture:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching profile picture' 
      });
    }

    if (results.length === 0 || !results[0].profilePicture) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile picture not found' 
      });
    }

    const imagePath = path.join(__dirname, '..', results[0].profilePicture);
res.sendFile(imagePath);

  });
});

module.exports = router;
