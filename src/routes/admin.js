const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Restaurant = require('../models/Restaurant');
const { requireAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/', requireAdmin, async (req, res) => {
    try {
        const users = await User.find().sort('name');
        const items = await Item.find().populate('restaurant');
        const restaurants = await Restaurant.find();

        // Calculate user statistics
        const stats = {
            totalUsers: users.length,
            admins: users.filter(u => u.isAdmin).length,
            activeUsers: users.filter(u => u.lastLogin > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
            usersByRoom: users.reduce((acc, user) => {
                acc[user.roomNumber] = (acc[user.roomNumber] || 0) + 1;
                return acc;
            }, {}),
            // Order statistics
            totalOrders: items.length,
            activeOrders: items.filter(i => i.status === 'open').length,
            deliveredOrders: items.filter(i => i.status === 'delivered').length,
            // Restaurant statistics
            totalRestaurants: restaurants.length,
            // Financial statistics
            totalRevenue: items.reduce((acc, item) => acc + (item.deliveryFee || 0), 0),
            // Most active users
            topUsers: users
                .sort((a, b) => b.statistics.totalOrders - a.statistics.totalOrders)
                .slice(0, 5)
                .map(u => ({
                    name: u.name,
                    orders: u.statistics.totalOrders,
                    spent: u.statistics.totalSpent
                }))
        };

        res.render('admin/dashboard', { users, stats, items, restaurants });
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        res.render('error', { message: 'Error loading admin dashboard', error: err });
    }
});

// User Management Routes
router.get('/users/new', requireAdmin, (req, res) => {
    res.render('admin/users/new', { error: null });
});

router.post('/users', requireAdmin, async (req, res) => {
    try {
        const { username, name, phoneNumber, roomNumber, password, isAdmin } = req.body;

        if (!username || !name || !phoneNumber || !roomNumber || !password) {
            return res.render('admin/users/new', { error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('admin/users/new', { error: 'User with this username already exists' });
        }

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
        res.render('admin/users/new', { error: 'Error creating user: ' + err.message });
    }
});

router.get('/users/:id/edit', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) throw new Error('User not found');
        res.render('admin/users/edit', { user, error: null });
    } catch (err) {
        console.error('Error loading user edit form:', err);
        res.render('error', { message: 'Error loading user edit form', error: err });
    }
});

router.post('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { username, name, phoneNumber, roomNumber, password, isAdmin } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) throw new Error('User not found');

        if (user.isAdmin && !isAdmin) {
            const adminCount = await User.countDocuments({ isAdmin: true });
            if (adminCount <= 1) throw new Error('Cannot remove the last admin user');
        }

        user.username = username;
        user.name = name;
        user.phoneNumber = phoneNumber;
        user.roomNumber = roomNumber;
        user.isAdmin = isAdmin === 'true';
        if (password) user.password = password;

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

router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) throw new Error('User not found');

        if (user.isAdmin) {
            const adminCount = await User.countDocuments({ isAdmin: true });
            if (adminCount <= 1) throw new Error('Cannot delete the last admin user');
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Restaurant Management Routes
router.get('/restaurants', requireAdmin, async (req, res) => {
    try {
        const restaurants = await Restaurant.find().sort('name');
        res.render('admin/restaurants', { restaurants });
    } catch (err) {
        console.error('Error loading restaurants:', err);
        res.render('error', { message: 'Error loading restaurants', error: err });
    }
});

// New restaurant form
router.get('/restaurants/new', requireAdmin, (req, res) => {
    res.render('admin/restaurants/new', { error: null });
});

// Create restaurant
router.post('/restaurants', requireAdmin, async (req, res) => {
    try {
        const { name, cuisine, phone, address, deliveryFee, menuItems } = req.body;

        // Create restaurant
        const restaurant = new Restaurant({
            name,
            cuisine,
            phone,
            address: {
                street: address.street,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode
            },
            deliveryFee: parseFloat(deliveryFee),
            menuItems: menuItems.map(item => ({
                name: item.name,
                description: item.description,
                price: parseFloat(item.price),
                category: item.category
            }))
        });

        await restaurant.save();
        res.redirect('/admin/restaurants');
    } catch (err) {
        console.error('Error creating restaurant:', err);
        res.render('admin/restaurants/new', {
            error: 'Error creating restaurant: ' + err.message
        });
    }
});

router.post('/restaurants/:id/toggle', requireAdmin, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) throw new Error('Restaurant not found');

        restaurant.isActive = !restaurant.isActive;
        await restaurant.save();

        res.json({ success: true, isActive: restaurant.isActive });
    } catch (err) {
        console.error('Error toggling restaurant status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Statistics and Reports
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const users = await User.find();
        const items = await Item.find().populate('restaurant');
        const restaurants = await Restaurant.find();

        const stats = {
            users: {
                total: users.length,
                admins: users.filter(u => u.isAdmin).length,
                active: users.filter(u => u.lastLogin > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
                byRoom: users.reduce((acc, user) => {
                    acc[user.roomNumber] = (acc[user.roomNumber] || 0) + 1;
                    return acc;
                }, {})
            },
            orders: {
                total: items.length,
                active: items.filter(i => i.status === 'open').length,
                delivered: items.filter(i => i.status === 'delivered').length,
                totalRevenue: items.reduce((acc, item) => acc + (item.deliveryFee || 0), 0)
            },
            restaurants: {
                total: restaurants.length,
                active: restaurants.filter(r => r.isActive).length,
                topRestaurants: restaurants
                    .map(r => ({
                        name: r.name,
                        orders: items.filter(i => i.restaurant._id.toString() === r._id.toString()).length
                    }))
                    .sort((a, b) => b.orders - a.orders)
                    .slice(0, 5)
            }
        };

        res.json(stats);
    } catch (err) {
        console.error('Error getting statistics:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;