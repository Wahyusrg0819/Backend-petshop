const express = require('express');
const db = require('../config/db'); // File db.js yang sudah diubah menggunakan promise()
const router = express.Router();

// CREATE a new pet order
router.post('/create', async (req, res) => {
  const { order_id, category_id, arrival_date, departure_date, daily_rate, tax } = req.body;

  try {
    const query = `
      INSERT INTO pet_orders (order_id, category_id, arrival_date, departure_date, daily_rate, tax)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [order_id, category_id, arrival_date, departure_date, daily_rate, tax]);

    res.status(201).json({ message: 'Pet order created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all pet orders
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT po.pet_order_id, o.order_id, o.user_id, pc.category_name, po.arrival_date, po.departure_date, 
             po.daily_rate, po.tax, po.total_days, po.total_cost
      FROM pet_orders po
      JOIN orders o ON po.order_id = o.order_id
      JOIN pet_categories pc ON po.category_id = pc.category_id
    `;

    const [rows] = await db.execute(query);

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ a single pet order by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT po.pet_order_id, o.order_id, o.user_id, pc.category_name, po.arrival_date, po.departure_date, 
             po.daily_rate, po.tax, po.total_days, po.total_cost
      FROM pet_orders po
      JOIN orders o ON po.order_id = o.order_id
      JOIN pet_categories pc ON po.category_id = pc.category_id
      WHERE po.pet_order_id = ?
    `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pet order not found' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
