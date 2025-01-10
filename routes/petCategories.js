const express = require('express');
const db = require('../config/db'); // Import koneksi database versi lama
const router = express.Router();

// CREATE a new pet category
router.post('/create', (req, res) => {
    const { category_name } = req.body;

    const query = `
        INSERT INTO pet_categories (category_name)
        VALUES (?)
    `;

    db.query(query, [category_name], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Category name must be unique' });
            } else {
                return res.status(500).json({ error: err.message });
            }
        }

        res.status(201).json({ 
            message: 'Pet category created successfully!', 
            category_id: result.insertId 
        });
    });
});

// READ all pet categories
router.get('/', (req, res) => {
    const query = `
        SELECT category_id, category_name, created_at, updated_at
        FROM pet_categories
    `;

    db.query(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(200).json(rows);
    });
});

// READ a single pet category by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT category_id, category_name, created_at, updated_at
        FROM pet_categories
        WHERE category_id = ?
    `;

    db.query(query, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Pet category not found' });
        }

        res.status(200).json(rows[0]);
    });
});

// UPDATE a pet category
router.put('/update/:id', (req, res) => {
    const { id } = req.params;
    const { category_name } = req.body;

    const query = `
        UPDATE pet_categories
        SET category_name = ?, updated_at = CURRENT_TIMESTAMP()
        WHERE category_id = ?
    `;

    db.query(query, [category_name, id], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Category name must be unique' });
            } else {
                return res.status(500).json({ error: err.message });
            }
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pet category not found' });
        }

        res.status(200).json({ message: 'Pet category updated successfully!' });
    });
});

// DELETE a pet category
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        DELETE FROM pet_categories
        WHERE category_id = ?
    `;

    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pet category not found' });
        }

        res.status(200).json({ message: 'Pet category deleted successfully!' });
    });
});

module.exports = router;
