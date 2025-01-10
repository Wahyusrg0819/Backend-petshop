// File: C:/Users/HP/PROJECT DPM/Backend/routes/product.js
const express = require('express');
const db = require('../config/db');
const upload = require('../middlewares/uploadMiddleware');
const router = express.Router();

// 1. Tambah produk baru
router.post('/addProduct', upload.single('productPict'), (req, res) => {
    const { name, description, price, stock, category_id } = req.body;

    // Validasi input
    if (!name || !price || !stock || !req.file) {
        return res.status(400).json({ message: 'Name, price, stock and image are required fields' });
    }

    // Ambil nama file dari req.file
    const productPict = `uploads/${req.file.filename}`; // Menggunakan nama asli

    const query = `
        INSERT INTO products (name, description, price, stock, category_id, productPict, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    db.query(query, [name, description || null, price || null, stock || null, category_id || null, productPict], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.status(201).json({ message: 'Product added successfully' });
    });
});


// 2. Upload gambar produk
router.post('/productPict/:product_id', upload.single('productPict'), (req, res) => {
    const { product_id } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const productPict = `uploads/${req.file.filename}`;

    const query = `UPDATE products SET productPict = ?, updated_at = NOW() WHERE product_id = ?`;
    db.query(query, [productPict, product_id], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.status(200).json({
            message: 'Product image updated successfully',
            productPict: `http://${req.headers.host}/${productPict}`,
        });
    });
});

// 3. Ambil semua produk
router.get('/all', (req, res) => {
    const query = `SELECT * FROM products`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        const products = results.map((product) => ({
            ...product,
            productPict: product.productPict
                ? `http://${req.headers.host}/${product.productPict}`
                : null,
        }));

        res.status(200).json({ message: 'Products retrieved successfully', products });
    });
});

// 4. Ambil produk berdasarkan ID
router.get('/getproduct/:product_id', (req, res) => {
    const { product_id } = req.params;

    console.log("Request diterima untuk product_id:", product_id); // Log parameter yang diterima

    const query = `SELECT * FROM products WHERE product_id = ?`;
    db.query(query, [product_id], (err, results) => {
        if (err) {
            console.error('Database error:', err); // Log error database
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        console.log("Hasil query:", results); // Log hasil query

        if (results.length === 0) {
            console.warn("Produk tidak ditemukan untuk product_id:", product_id); // Log jika produk tidak ditemukan
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = results[0];

        // Periksa apakah gambar ada, jika tidak, set null
        product.productPict = product.productPict
            ? `http://${req.headers.host}/${product.productPict}`
            : null;

        console.log("Produk ditemukan:", product); // Log detail produk sebelum dikirim ke frontend

        res.status(200).json({
            message: 'Product retrieved successfully',
            product
        });
    });
});

// 5. Update produk
router.put('/product/update/:product_id', (req, res) => {
    const { product_id } = req.params;
    const { name, description, price, stock, category_id } = req.body;

    const query = `
        UPDATE products
        SET name = ?, description = ?, price = ?, stock = ?, category_id = ?, updated_at = NOW()
        WHERE product_id = ?
    `;

    db.query(query, [name, description || null, price || null, stock || null, category_id || null, product_id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product updated successfully' });
    });
});

// 6. Hapus produk  
router.delete('/product/delete/:product_id', (req, res) => {  
    const { product_id } = req.params;  
    console.log('Attempting to delete product:', product_id);
    
    const productIdNum = parseInt(product_id, 10);  

    if (isNaN(productIdNum)) {  
        return res.status(400).json({ message: 'Invalid Product ID' });  
    }  

    // Langsung hapus produk karena CASCADE akan menangani order_items
    const deleteQuery = 'DELETE FROM products WHERE product_id = ?';
    
    db.query(deleteQuery, [productIdNum], (err, result) => {
        if (err) {
            console.error('Delete error:', err);
            return res.status(500).json({ 
                message: 'Failed to delete product',
                error: err.message 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found',
                productId: productIdNum
            });
        }

        res.status(200).json({
            message: 'Product deleted successfully',
            productId: productIdNum,
            affectedRows: result.affectedRows
        });
    });
});


module.exports = router;