const express = require('express');
const db = require('../config/db');
const router = express.Router();

// 1. Tambah produk ke favorit
router.post('/addFavorite', (req, res) => {
    const { user_id, product_id } = req.body;

    // Validasi input
    if (!user_id || !product_id) {
        return res.status(400).json({ message: 'user_id dan product_id diperlukan.' });
    }

    // Query untuk menambahkan produk ke daftar favorit
    const query = `
        INSERT INTO user_favorites (user_id, product_id, saved_at)
        VALUES (?, ?, NOW())
    `;

    db.query(query, [user_id, product_id], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Terjadi kesalahan di database', error: err.message });
        }
        res.status(201).json({ message: 'Produk berhasil ditambahkan ke favorit.' });
    });
});

// 2. Ambil daftar produk favorit dari pengguna
router.get('/:user_id', (req, res) => {
    const { user_id } = req.params;

    // Query untuk mendapatkan produk favorit pengguna
    const query = `
        SELECT p.* 
        FROM products p
        JOIN user_favorites uf ON p.product_id = uf.product_id
        WHERE uf.user_id = ?
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Terjadi kesalahan di database', error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Tidak ada produk favorit ditemukan.' });
        }

        res.status(200).json(results);
    });
});

// 3. Hapus produk dari daftar favorit
router.delete('/removeFavorite', (req, res) => {
    const { user_id, product_id } = req.body;

    // Validasi input
    if (!user_id || !product_id) {
        return res.status(400).json({ message: 'user_id dan product_id diperlukan.' });
    }

    // Query untuk menghapus produk dari daftar favorit
    const query = `
        DELETE FROM user_favorites 
        WHERE user_id = ? AND product_id = ?
    `;

    db.query(query, [user_id, product_id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Terjadi kesalahan di database', error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan dalam favorit pengguna.' });
        }

        res.status(200).json({ message: 'Produk berhasil dihapus dari favorit.' });
    });
});

module.exports = router;
