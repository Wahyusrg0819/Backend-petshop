const express = require('express');
const db = require('../config/db');
const router = express.Router();

// CREATE a new order
router.post('/create', async (req, res) => {
    const { user_id, order_type, total_price, status, payment_method, items } = req.body;
    
    console.log('Received order data:', {
        user_id,
        order_type,
        total_price,
        status,
        payment_method,
        items
    });

    // Validasi input
    if (!user_id || !order_type || !total_price) {
        console.log('Missing required fields:', { user_id, order_type, total_price });
        return res.status(400).json({
            error: 'Missing required fields',
            details: 'user_id, order_type, and total_price are required'
        });
    }

    // Validasi order_type
    if (!['product', 'pet'].includes(order_type)) {
        console.log('Invalid order_type:', order_type);
        return res.status(400).json({
            error: 'Invalid order_type',
            details: 'order_type must be either "product" or "pet"'
        });
    }

    // Validasi status
    if (status && !['pending', 'completed', 'cancelled', 'delivered'].includes(status)) {
        console.log('Invalid status:', status);
        return res.status(400).json({
            error: 'Invalid status',
            details: 'status must be either "pending", "completed", "cancelled", or "delivered"'
        });
    }

    // Cek apakah user exists
    db.query('SELECT user_id FROM users WHERE user_id = ?', [user_id], (err, users) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({
                error: err.message,
                details: 'Error checking user in database'
            });
        }

        if (users.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                details: `No user found with id ${user_id}`
            });
        }

        // Mulai transaction
        db.beginTransaction(async (err) => {
            if (err) {
                return res.status(500).json({
                    error: err.message,
                    details: 'Error starting transaction'
                });
            }

            try {
                // Buat order baru
                const orderQuery = `INSERT INTO orders (user_id, order_type, total_price, status)
                                VALUES (?, ?, ?, ?)`;
                const orderValues = [user_id, order_type, total_price, status || 'pending'];
                
                const [orderResult] = await db.promise().query(orderQuery, orderValues);
                const orderId = orderResult.insertId;

                // Jika ada items, simpan ke order_items
                if (items && items.length > 0) {
                    // Ambil harga produk dari database
                    const productIds = items.map(item => item.product_id);
                    const [products] = await db.promise().query(
                        'SELECT product_id, price, stock FROM products WHERE product_id IN (?)',
                        [productIds]
                    );

                    // Cek stok produk
                    for (const item of items) {
                        const product = products.find(p => p.product_id === item.product_id);
                        if (!product) {
                            throw new Error(`Product with ID ${item.product_id} not found`);
                        }
                        if (product.stock < item.quantity) {
                            throw new Error(`Insufficient stock for product ID ${item.product_id}`);
                        }
                    }

                    const itemsQuery = `INSERT INTO order_items (order_id, product_id, quantity, price_per_item)
                                    VALUES ?`;
                    const itemsValues = items.map(item => {
                        const product = products.find(p => p.product_id === item.product_id);
                        return [
                            orderId,
                            item.product_id,
                            item.quantity,
                            product ? product.price : 0 // menggunakan harga dari database
                        ];
                    });

                    await db.promise().query(itemsQuery, [itemsValues]);

                    // Update stok produk
                    for (const item of items) {
                        const updateStockQuery = `
                            UPDATE products 
                            SET stock = stock - ?, 
                                updated_at = NOW() 
                            WHERE product_id = ?
                        `;
                        await db.promise().query(updateStockQuery, [item.quantity, item.product_id]);
                    }
                }

                // Buat notifikasi
                const notificationQuery = `
                    INSERT INTO notifications (user_id, title, description, type, reference_id)
                    VALUES (?, ?, ?, ?, ?)
                `;
                const notificationValues = [
                    user_id,
                    'Pesanan Berhasil',
                    'Pesanan Anda telah berhasil dibuat dan sedang diproses',
                    'order',
                    orderId
                ];

                const [notifResult] = await db.promise().query(notificationQuery, notificationValues);

                // Commit transaction
                await db.promise().commit();

                res.status(201).json({ 
                    message: 'Order created successfully!', 
                    order_id: orderId,
                    payment_method,
                    notification_id: notifResult.insertId
                });

            } catch (error) {
                // Rollback jika terjadi error
                await db.promise().rollback();
                console.error('Error in transaction:', error);
                res.status(500).json({
                    error: error.message,
                    details: 'Error in transaction'
                });
            }
        });
    });
});

// READ all orders
router.get('/', (req, res) => {
    db.query('SELECT * FROM orders ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

// READ orders by user_id
router.get('/user/:user_id', (req, res) => {
    const query = `
        SELECT 
            o.*,
            oi.quantity,
            oi.price_per_item,
            p.product_id,
            p.name as product_name,
            p.productPict,
            p.price as product_price
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;

    db.query(query, [req.params.user_id], (err, rows) => {
        if (err) {
            console.error('Error fetching user orders:', err);
            return res.status(500).json({ error: err.message });
        }

        // Group items by order
        const orders = rows.reduce((acc, row) => {
            const order = acc.find(o => o.order_id === row.order_id);
            
            if (order) {
                // If product exists, add to items array
                if (row.product_id) {
                    order.items.push({
                        product_id: row.product_id,
                        name: row.product_name,
                        productPict: row.productPict,
                        price: row.price_per_item,
                        quantity: row.quantity
                    });
                }
            } else {
                // Create new order
                const newOrder = {
                    order_id: row.order_id,
                    user_id: row.user_id,
                    order_type: row.order_type,
                    total_price: row.total_price,
                    status: row.status,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    items: []
                };

                // Add product if exists
                if (row.product_id) {
                    newOrder.items.push({
                        product_id: row.product_id,
                        name: row.product_name,
                        productPict: row.productPict,
                        price: row.price_per_item,
                        quantity: row.quantity
                    });
                }

                acc.push(newOrder);
            }
            return acc;
        }, []);

        res.status(200).json(orders);
    });
});

// UPDATE order status
router.put('/:order_id', (req, res) => {
    const { status } = req.body;
    
    // Dapatkan informasi order sebelum update
    db.query('SELECT user_id FROM orders WHERE order_id = ?', [req.params.order_id], (err, orders) => {
        if (err) {
            console.error('Error fetching order:', err);
            return res.status(500).json({ error: err.message });
        }

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const user_id = orders[0].user_id;

        // Update status order
        db.query(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
            [status, req.params.order_id],
            (updateErr, result) => {
                if (updateErr) {
                    console.error('Error updating order:', updateErr);
                    return res.status(500).json({ error: updateErr.message });
                }

                // Buat notifikasi untuk perubahan status
                const notificationQuery = `
                    INSERT INTO notifications (user_id, title, description, type, reference_id)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                let notificationTitle, notificationDesc;
                
                switch(status) {
                    case 'completed':
                        notificationTitle = 'Pesanan Selesai';
                        notificationDesc = 'Pesanan Anda telah selesai. Terima kasih telah berbelanja!';
                        break;
                    case 'cancelled':
                        notificationTitle = 'Pesanan Dibatalkan';
                        notificationDesc = 'Pesanan Anda telah dibatalkan';
                        break;
                    case 'delivered':
                        notificationTitle = 'Pesanan Dikirim';
                        notificationDesc = 'Pesanan Anda sedang dalam perjalanan';
                        break;
                    default:
                        notificationTitle = 'Status Pesanan Diperbarui';
                        notificationDesc = `Status pesanan Anda telah diperbarui menjadi ${status}`;
                }

                const notificationValues = [
                    user_id,
                    notificationTitle,
                    notificationDesc,
                    'order_status',
                    req.params.order_id
                ];

                db.query(notificationQuery, notificationValues);
                
                res.status(200).json({ message: 'Order updated successfully' });
            }
        );
    });
});

module.exports = router;
