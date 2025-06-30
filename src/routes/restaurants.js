const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { requireLogin } = require('../middleware/auth');

// List all restaurants
router.get('/', requireLogin, async (req, res) => {
    try {
        const restaurants = await Restaurant.find()
            .select('name cuisine deliveryFee')
            .sort('name');

        res.render('restaurants/index', { restaurants });
    } catch (err) {
        console.error('Error loading restaurants:', err);
        res.render('error', { message: 'Error loading restaurants', error: err });
    }
});

// View restaurant menu
router.get('/:id/menu', requireLogin, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        
        if (!restaurant) {
            throw new Error('Restaurant not found');
        }

        // Group menu items by category
        const menuByCategory = restaurant.menuItems.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        // Sort items within each category by name
        Object.values(menuByCategory).forEach(items => {
            items.sort((a, b) => a.name.localeCompare(b.name));
        });

        res.render('restaurants/menu', { 
            restaurant,
            menuByCategory,
            categories: Object.keys(menuByCategory).sort()
        });
    } catch (err) {
        console.error('Error loading restaurant menu:', err);
        res.render('error', { message: 'Error loading restaurant menu', error: err });
    }
});

// Get restaurant details (API endpoint)
router.get('/:id', requireLogin, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        res.json(restaurant);
    } catch (err) {
        console.error('Error getting restaurant details:', err);
        res.status(500).json({ error: 'Error getting restaurant details' });
    }
});

module.exports = router;