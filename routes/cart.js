// File: C:/Users/HP/PROJECT DPM/Backend/routes/cart.js
const express = require('express');
const db = require('../config/db'); // Koneksi database
const router = express.Router();

// Menambahkan produk ke cart
router.post('/addcart', (req, res) => {
    const { user_id, product_id, productPict, quantity, price } = req.body;

    console.log('Request body:', req.body); // Debugging

    // Validasi input
    if (!user_id || !product_id || !quantity || !price || !productPict) {
        return res.status(400).json({ message: 'Please provide all required fields: user_id, product_id, productPict, quantity, and price' });
    }

    const query = `
        INSERT INTO cart (user_id, product_id, productPict, quantity, price, added_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        quantity = quantity + VALUES(quantity),
        updated_at = NOW();
    `;

    db.query(query, [user_id, product_id, productPict, quantity, price], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.status(201).json({ message: 'Product added to cart successfully', cartId: results.insertId });
    });
});


// Mengupdate jumlah produk di cart
router.put('/update/:cart_id', (req, res) => {
    const { cart_id } = req.params;
    const { quantity } = req.body;

    if (!quantity) {
        return res.status(400).json({ message: 'Please provide quantity' });
    }

    const query = `
        UPDATE cart
        SET quantity = ?, updated_at = NOW()
        WHERE cart_id = ?
    `;

    db.query(query, [quantity, cart_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.status(200).json({ message: 'Cart updated successfully', affectedRows: results.affectedRows });
    });
});

// Menghapus produk dari cart
router.delete('/delete/:cart_id', (req, res) => {
    const { cart_id } = req.params;

    const query = `
        DELETE FROM cart WHERE cart_id = ?
    `;

    db.query(query, [cart_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.status(200).json({ message: 'Product removed from cart', affectedRows: results.affectedRows });
    });
});

// Melihat isi cart berdasarkan user_id
router.get('/view/:user_id', (req, res) => {
    const { user_id } = req.params;

    const query = `
        SELECT cart.cart_id, cart.user_id, cart.product_id, cart.productPict, cart.quantity, cart.price, 
               products.name AS product_name, products.description, products.price AS current_price
        FROM cart
        JOIN products ON cart.product_id = products.product_id
        WHERE cart.user_id = ?
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.status(200).json({ message: 'Cart retrieved successfully', cart: results });
    });
});

module.exports = router;