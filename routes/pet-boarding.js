const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all pet boarding orders
router.get('/', (req, res) => {
  const query = `
    SELECT pb.*, u.name as customer_name 
    FROM pet_boarding pb
    JOIN users u ON pb.user_id = u.user_id
    ORDER BY pb.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching pet boarding orders:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// Get pet boarding orders by user_id
router.get('/user/:user_id', (req, res) => {
  const query = `
    SELECT * FROM pet_boarding 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [req.params.user_id], (err, results) => {
    if (err) {
      console.error('Error fetching user pet boarding:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// Create new pet boarding order
router.post('/create', (req, res) => {
  const {
    user_id,
    pet_category,
    start_date,
    end_date,
    duration_days,
    price_per_day,
    tax,
    total_price
  } = req.body;

  const query = `
    INSERT INTO pet_boarding (
      user_id, pet_category, start_date, end_date, 
      duration_days, price_per_day, tax, total_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [user_id, pet_category, start_date, end_date, duration_days, price_per_day, tax, total_price],
    (err, result) => {
      if (err) {
        console.error('Error creating pet boarding:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Buat notifikasi untuk admin
      const notifQuery = `
        INSERT INTO notifications (title, description, type, reference_id, user_id)
        VALUES (?, ?, ?, ?, ?)
      `;

      const notifValues = [
        'Pesanan Penitipan Baru',
        `Penitipan ${pet_category} dari ${start_date} sampai ${end_date}`,
        'pet_boarding',
        result.insertId,
        user_id
      ];

      db.query(notifQuery, notifValues);

      res.status(201).json({ 
        message: 'Pet boarding created successfully',
        booking_id: result.insertId
      });
    }
  );
});

// Update pet boarding status
router.put('/status/:booking_id', (req, res) => {
  const { status } = req.body;
  const query = `
    UPDATE pet_boarding 
    SET status = ?
    WHERE booking_id = ?
  `;

  db.query(query, [status, req.params.booking_id], (err, result) => {
    if (err) {
      console.error('Error updating pet boarding:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Buat notifikasi untuk user
    const notifQuery = `
      INSERT INTO notifications (title, description, type, reference_id, user_id)
      SELECT 
        'Status Penitipan Diperbarui',
        CONCAT('Status penitipan Anda telah diubah menjadi ', ?),
        'pet_boarding_status',
        booking_id,
        user_id
      FROM pet_boarding
      WHERE booking_id = ?
    `;

    db.query(notifQuery, [status, req.params.booking_id]);

    res.json({ message: 'Status updated successfully' });
  });
});

module.exports = router;
