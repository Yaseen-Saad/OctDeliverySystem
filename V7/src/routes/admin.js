const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/', requireAdmin, async (req, res) => {
    try {
        const users = await User.find().sort('name');
        const stats = {
            totalUsers: users.length,
            admins: users.filter(u => u.isAdmin).length,
            activeUsers: users.filter(u => u.lastLogin > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
            usersByRoom: users.reduce((acc, user) => {
                acc[user.roomNumber] = (acc[user.roomNumber] || 0) + 1;
                return acc;
            }, {})
        };
        res.render('admin/dashboard', { users, stats });
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        res.render('error', { message: 'Error loading admin dashboard', error: err });
    }
});

// Create user form
router.get('/users/new', requireAdmin, (req, res) => {
    res.render('admin/users/new', { error: null });
});

// Create user
router.post('/users', requireAdmin, async (req, res) => {
    try {
        const { username, name, phoneNumber, roomNumber, password, isAdmin } = req.body;

        // Validate required fields
        if (!username || !name || !phoneNumber || !roomNumber || !password) {
            return res.render('admin/users/new', {
                error: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('admin/users/new', {
                error: 'User with this username already exists'
            });
        }

        // Create user
        const user = new User({
            username,
            name,
            phoneNumber,
            roomNumber,
            password,
            isAdmin: isAdmin === 'true',
            preferences: { theme: 'system' },
            statistics: {
                totalOrders: 0,
                totalSpent: 0,
                favoriteRestaurants: [],
                mostOrderedItems: []
            }
        });

        await user.save();
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating user:', err);
        res.render('admin/users/new', {
            error: 'Error creating user: ' + err.message
        });
    }
});

// Edit user form
router.get('/users/:id/edit', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            throw new Error('User not found');
        }
        res.render('admin/users/edit', { user, error: null });
    } catch (err) {
        console.error('Error loading user edit form:', err);
        res.render('error', { message: 'Error loading user edit form', error: err });
    }
});

// Update user
router.post('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { username, name, phoneNumber, roomNumber, password, isAdmin } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            throw new Error('User not found');
        }

        // Don't allow removing the last admin
        if (user.isAdmin && !isAdmin) {
            const adminCount = await User.countDocuments({ isAdmin: true });
            if (adminCount <= 1) {
                throw new Error('Cannot remove the last admin user');
            }
        }

        // Update basic info
        user.username = username;
        user.name = name;
        user.phoneNumber = phoneNumber;
        user.roomNumber = roomNumber;
        user.isAdmin = isAdmin === 'true';

        // Update password if provided
        if (password) {
            user.password = password;
        }

        await user.save();
        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating user:', err);
        res.render('admin/users/edit', {
            user: await User.findById(req.params.id),
            error: 'Error updating user: ' + err.message
        });
    }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Don't allow deleting the last admin
        if (user.isAdmin) {
            const adminCount = await User.countDocuments({ isAdmin: true });
            if (adminCount <= 1) {
                throw new Error('Cannot delete the last admin user');
            }
        }

        await user.delete();
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;