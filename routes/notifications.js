const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Get notifications for user
router.get('/user/:user_id', (req, res) => {
    const query = `
        SELECT * FROM notifications 
        WHERE user_id = ? OR type = 'promo'
        ORDER BY created_at DESC
    `;

    db.query(query, [req.params.user_id], (err, notifications) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error fetching notifications from database'
            });
        }
        res.status(200).json(notifications);
    });
});

// Get public notifications (promo)
router.get('/public', (req, res) => {
    const query = `
        SELECT * FROM notifications 
        WHERE type = 'promo'
        ORDER BY created_at DESC
    `;

    db.query(query, (err, notifications) => {
        if (err) {
            console.error('Error fetching public notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error fetching public notifications from database'
            });
        }
        res.status(200).json(notifications);
    });
});

// Create notification
router.post('/create', (req, res) => {
    const { user_id, title, description, type, reference_id } = req.body;
    
    const query = `
        INSERT INTO notifications (user_id, title, description, type, reference_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [user_id, title, description, type, reference_id], (err, result) => {
        if (err) {
            console.error('Error creating notification:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error creating notification in database'
            });
        }
        res.status(201).json({
            message: 'Notification created successfully',
            notification_id: result.insertId
        });
    });
});

// Mark notification as read
router.put('/read/:notification_id', (req, res) => {
    const query = `
        UPDATE notifications 
        SET is_read = 1 
        WHERE notification_id = ?
    `;

    db.query(query, [req.params.notification_id], (err, result) => {
        if (err) {
            console.error('Error updating notification:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error updating notification in database'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Notification not found' 
            });
        }

        res.status(200).json({ 
            message: 'Notification marked as read' 
        });
    });
});

// Delete notification
router.delete('/:notification_id', (req, res) => {
    const query = `
        DELETE FROM notifications 
        WHERE notification_id = ?
    `;

    db.query(query, [req.params.notification_id], (err, result) => {
        if (err) {
            console.error('Error deleting notification:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error deleting notification from database'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Notification not found' 
            });
        }

        res.status(200).json({ 
            message: 'Notification deleted successfully' 
        });
    });
});

// Delete all notifications for a user
router.delete('/user/:user_id', (req, res) => {
    const query = `
        DELETE FROM notifications 
        WHERE user_id = ?
    `;

    db.query(query, [req.params.user_id], (err, result) => {
        if (err) {
            console.error('Error deleting notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error deleting notifications from database'
            });
        }

        res.status(200).json({ 
            message: 'All notifications deleted successfully',
            count: result.affectedRows
        });
    });
});

// Get admin notifications
router.get('/admin', (req, res) => {
    const query = `
        SELECT * FROM admin_notifications 
        ORDER BY created_at DESC
    `;

    db.query(query, (err, notifications) => {
        if (err) {
            console.error('Error fetching admin notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error fetching admin notifications from database'
            });
        }
        res.status(200).json(notifications);
    });
});

// Create admin notification
router.post('/admin', (req, res) => {
    const { title, message, order_id, notification_type } = req.body;
    
    const query = `
        INSERT INTO admin_notifications (title, message, order_id, notification_type)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [title, message, order_id, notification_type], (err, result) => {
        if (err) {
            console.error('Error creating admin notification:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error creating admin notification in database'
            });
        }
        res.status(201).json({
            message: 'Admin notification created successfully',
            notification_id: result.insertId
        });
    });
});

// Mark admin notification as read
router.put('/admin/read/:notification_id', (req, res) => {
    const query = `
        UPDATE admin_notifications 
        SET is_read = true 
        WHERE notification_id = ?
    `;

    db.query(query, [req.params.notification_id], (err, result) => {
        if (err) {
            console.error('Error updating admin notification:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error updating admin notification in database'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Admin notification not found' 
            });
        }

        res.status(200).json({ 
            message: 'Admin notification marked as read' 
        });
    });
});

// Delete admin notification
router.delete('/admin/:notification_id', (req, res) => {
    const query = `
        DELETE FROM admin_notifications 
        WHERE notification_id = ?
    `;

    db.query(query, [req.params.notification_id], (err, result) => {
        if (err) {
            console.error('Error deleting admin notification:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error deleting admin notification from database'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Admin notification not found' 
            });
        }

        res.status(200).json({ 
            message: 'Admin notification deleted successfully' 
        });
    });
});

// Delete all admin notifications
router.delete('/admin', (req, res) => {
    const query = `
        DELETE FROM admin_notifications
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error deleting admin notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error deleting admin notifications from database'
            });
        }

        res.status(200).json({ 
            message: 'All admin notifications deleted successfully',
            count: result.affectedRows
        });
    });
});

// Get unread admin notifications count
router.get('/admin/unread/count', (req, res) => {
    const query = `
        SELECT COUNT(*) as unread_count 
        FROM admin_notifications 
        WHERE is_read = false
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error counting unread notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error counting unread notifications from database'
            });
        }
        res.status(200).json({ 
            unread_count: result[0].unread_count 
        });
    });
});

// Get latest admin notifications
router.get('/admin/latest', (req, res) => {
    const query = `
        SELECT * FROM admin_notifications 
        WHERE is_read = false
        ORDER BY created_at DESC 
        LIMIT 5
    `;

    db.query(query, (err, notifications) => {
        if (err) {
            console.error('Error fetching latest notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error fetching latest notifications from database'
            });
        }
        res.status(200).json(notifications);
    });
});

// Get unread notifications count for user or public
router.get('/notifications/user/:user_id/unread/count', (req, res) => {
    const query = `
        SELECT COUNT(*) as unread_count 
        FROM user_notifications 
        WHERE user_id = ? AND is_read = false
    `;

    db.query(query, [req.params.user_id], (err, result) => {
        if (err) {
            console.error('Error counting unread notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error counting unread notifications from database'
            });
        }
        res.status(200).json({ 
            unread_count: result[0].unread_count 
        });
    });
});

// Get public notifications count (for logged out users)
router.get('/notifications/public/unread/count', (req, res) => {
    const query = `
        SELECT COUNT(*) as unread_count 
        FROM user_notifications 
        WHERE user_id IS NULL AND is_read = false
        AND notification_type = 'promo'
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error counting public notifications:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error counting public notifications from database'
            });
        }
        res.status(200).json({ 
            unread_count: result[0].unread_count 
        });
    });
});

// Create public notification (for promos, etc)
router.post('/notifications/public', (req, res) => {
    const { title, message, notification_type = 'promo' } = req.body;
    
    const query = `
        INSERT INTO user_notifications (title, message, notification_type)
        VALUES (?, ?, ?)
    `;

    db.query(query, [title, message, notification_type], (err, result) => {
        if (err) {
            console.error('Error creating public notification:', err);
            return res.status(500).json({ 
                error: err.message,
                details: 'Error creating public notification in database'
            });
        }
        res.status(201).json({
            message: 'Public notification created successfully',
            notification_id: result.insertId
        });
    });
});

module.exports = router; 