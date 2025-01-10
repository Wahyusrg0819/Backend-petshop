// File: C:/Users/HP/PROJECT DPM/Backend/routes/profile.js
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require('dotenv');
const router = express.Router();

dotenv.config();

// Endpoint untuk mengambil profil pengguna
router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    db.query('SELECT user_id, name, email, username, phone, address, profilePicture, recipient_name, notes FROM users WHERE user_id = ?', [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = results[0];

      // Transform response untuk include full URL jika ada profilePicture
      if (user.profilePicture) {
        user.profilePicture = `http://172.20.10.3:5000${user.profilePicture.startsWith('/') ? '' : '/'}${user.profilePicture}`;
      }

      res.status(200).json({
        success: true,
        user: {
          userId: user.user_id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
          address: user.address,
          profilePicture: user.profilePicture,
          recipientName: user.recipient_name,
          notes: user.notes
        }
      });
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token', error: error.message });
  }
});

// Endpoint untuk mengecek status token
router.get('/check-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ isValid: false });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ isValid: true });
  } catch (error) {
    res.json({ isValid: false });
  }
});

router.put('/updateProfile/:user_id', (req, res) => {
  const userIdFromParam = req.params.user_id;  // Ambil user_id dari URL
  const { name, email, phone, address, profilePicture, username, recipientName, notes } = req.body;

  console.log('Request body:', { name, email, phone, address, profilePicture, username, recipientName, notes });  // Debugging log

  // Verifikasi token dan pastikan user_id dari token cocok dengan user_id di URL
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = decoded.userId;
    console.log('Decoded token:', decoded);  // Debugging log

    // Pastikan userId dari token sama dengan userId di parameter URL
    if (userIdFromToken !== parseInt(userIdFromParam)) {
      return res.status(403).json({ message: 'Forbidden: You cannot update another user\'s profile' });
    }

    // Cek apakah user dengan user_id ada di database
    db.query('SELECT * FROM users WHERE user_id = ?', [userIdFromParam], (err, results) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ message: 'Error checking user', error: err.message });
      }
      if (results.length === 0) {
        console.log('User not found!');
        return res.status(404).json({ message: 'User not found' });
      }

      // Cek apakah ada perubahan data
      const changes = {};
      if (name && name !== results[0].name) changes.name = name;
      if (email && email !== results[0].email) changes.email = email;
      if (phone && phone !== results[0].phone) changes.phone = phone;
      if (username && username !== results[0].username) changes.username = username;
      if (address && address !== results[0].address) changes.address = address;
      if (profilePicture && profilePicture !== results[0].profilePicture) changes.profilePicture = profilePicture;
      if (recipientName && recipientName !== results[0].recipient_name) changes.recipientName = recipientName;
      if (notes && notes !== results[0].notes) changes.notes = notes;

      // Jika tidak ada perubahan data, kirim response tanpa melakukan update
      if (Object.keys(changes).length === 0) {
        return res.status(200).json({
          message: 'No changes detected'
        });
      }

      // Query update dengan penambahan updated_at
      const updateQuery = `
        UPDATE users
        SET
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          username = COALESCE(?, username),
          address = COALESCE(?, address),
          profilePicture = COALESCE(?, profilePicture),
          recipient_name = COALESCE(?, recipient_name),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?;
      `;

      db.query(updateQuery, [
        changes.name,
        changes.email,
        changes.phone,
        changes.username,
        changes.address,
        changes.profilePicture,
        changes.recipientName,
        changes.notes,
        userIdFromParam
      ], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }

        console.log('Update Results:', results);  // Debugging log
        if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'User not found or no changes made' });
        }

        res.status(200).json({
          message: 'Profile updated successfully',
          affectedRows: results.affectedRows
        });
      });
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token', error: error.message });
  }
});

router.put('/updateAddress/:user_id', (req, res) => {
  const userIdFromParam = req.params.user_id;
  const { address } = req.body;

  console.log('Request body:', { address });

  // Verify token and check if user_id matches
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = decoded.userId;
    console.log('Decoded token:', decoded);

    // Ensure token userId matches URL parameter userId
    if (userIdFromToken !== parseInt(userIdFromParam)) {
      return res.status(403).json({ 
        message: 'Forbidden: You cannot update another user\'s address' 
      });
    }

    // Check if user exists and get current address
    db.query(
      'SELECT address FROM users WHERE user_id = ?', 
      [userIdFromParam], 
      (err, results) => {
        if (err) {
          console.error('Error checking user:', err);
          return res.status(500).json({ 
            message: 'Error checking user', 
            error: err.message 
          });
        }

        if (results.length === 0) {
          console.log('User not found!');
          return res.status(404).json({ message: 'User not found' });
        }

        // If new address is same as current address, return early
        if (address === results[0].address) {
          return res.status(200).json({
            message: 'No changes detected'
          });
        }

        // Update address and updated_at timestamp
        const updateQuery = `
          UPDATE users
          SET
            address = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?;
        `;

        db.query(
          updateQuery, 
          [address, userIdFromParam],
          (err, results) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ 
                message: 'Database error', 
                error: err.message 
              });
            }

            console.log('Update Results:', results);
            if (results.affectedRows === 0) {
              return res.status(404).json({ 
                message: 'User not found or no changes made' 
              });
            }

            res.status(200).json({
              message: 'Address updated successfully',
              affectedRows: results.affectedRows
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      message: 'Unauthorized: Invalid token', 
      error: error.message 
    });
  }
});

module.exports = router;
