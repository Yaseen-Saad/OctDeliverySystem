const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { requireLogin } = require('../middleware/auth');

// List all items
router.get('/', requireLogin, async (req, res) => {
    try {
        const items = await Item.find()
            .populate('restaurant')
            .populate('createdBy')
            .populate('individualOrders.user')
            .sort('-createdAt');

        // Get user's statistics
        const user = await User.findById(req.session.user.id);

        res.render('items/index', { 
            items,
            statistics: user.statistics,
            paymentHistory: user.paymentHistory
        });
    } catch (err) {
        console.error('Error loading orders:', err);
        res.render('error', { message: 'Error loading orders', error: err });
    }
});

// New item form
router.get('/new', requireLogin, async (req, res) => {
    try {
        const restaurants = await Restaurant.find()
            .select('name cuisine deliveryFee')
            .sort('name');

        res.render('items/new', { 
            restaurants,
            user: req.session.user,
            error: null
        });
    } catch (err) {
        console.error('Error loading new order form:', err);
        res.render('error', { message: 'Error loading new order form', error: err });
    }
});

// Create new item
router.post('/', requireLogin, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.body.restaurant);
        if (!restaurant) {
            throw new Error('Restaurant not found');
        }

        // Validate delivery time
        const deliveryTime = new Date(req.body.deliveryTime);
        const minTime = new Date();
        minTime.setMinutes(minTime.getMinutes() + 30);
        
        if (deliveryTime < minTime) {
            return res.render('items/new', {
                restaurants: await Restaurant.find().select('name cuisine deliveryFee').sort('name'),
                user: req.session.user,
                error: 'Delivery time must be at least 30 minutes from now'
            });
        }

        const item = new Item({
            restaurant: restaurant._id,
            deliveryTime,
            createdBy: req.session.user.id,
            creatorRoom: req.body.tempRoom || req.session.user.roomNumber,
            message: req.body.message,
            status: 'open',
            deliveryFee: restaurant.deliveryFee
        });

        await item.save();
        res.redirect(`/items/${item._id}`);
    } catch (err) {
        console.error('Error creating order:', err);
        res.render('error', { message: 'Error creating order', error: err });
    }
});

// View item details
router.get('/:id', requireLogin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('restaurant')
            .populate('createdBy')
            .populate('individualOrders.user');

        if (!item) {
            throw new Error('Order not found');
        }

        const isCreator = item.createdBy._id.toString() === req.session.user.id;

        res.render('items/details', { 
            item, 
            isCreator,
            user: req.session.user
        });
    } catch (err) {
        console.error('Error loading order details:', err);
        res.render('error', { message: 'Error loading order details', error: err });
    }
});

// Add order to item
router.post('/:id/add-order', requireLogin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('restaurant');

        if (!item) {
            throw new Error('Order not found');
        }

        if (item.status !== 'open') {
            throw new Error('Order is not open');
        }

        const items = JSON.parse(req.body.items);
        if (!items.length) {
            throw new Error('No items selected');
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFeeShare = item.deliveryFee / (item.individualOrders.length + 1);

        const order = {
            user: req.session.user.id,
            items,
            subtotal,
            totalAmount: subtotal + deliveryFeeShare,
            specialInstructions: req.body.specialInstructions,
            paid: false,
            amountPaid: 0,
            change: 0
        };

        // Add order
        item.individualOrders.push(order);

        // Recalculate delivery fee shares for all orders
        const newDeliveryFeeShare = item.deliveryFee / item.individualOrders.length;
        item.individualOrders.forEach(order => {
            order.totalAmount = order.subtotal + newDeliveryFeeShare;
        });

        await item.save();

        // Update user statistics
        const user = await User.findById(req.session.user.id);

        // Add to payment history
        user.paymentHistory.push({
            orderId: item._id,
            restaurantName: item.restaurant.name,
            amount: subtotal,
            deliveryFee: newDeliveryFeeShare,
            status: 'unpaid'
        });

        // Update user statistics
        user.updateStatistics({
            restaurantId: item.restaurant._id,
            restaurantName: item.restaurant.name,
            items,
            totalAmount: subtotal + newDeliveryFeeShare
        });

        await user.save();

        res.redirect(`/items/${item._id}`);
    } catch (err) {
        console.error('Error adding order:', err);
        res.render('error', { message: 'Error adding order', error: err });
    }
});

// Remove order from item
router.post('/:id/remove-order/:orderId', requireLogin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        
        if (!item) {
            throw new Error('Order not found');
        }

        // Find the order index
        const orderIndex = item.individualOrders.findIndex(
            order => order._id.toString() === req.params.orderId
        );

        if (orderIndex === -1) {
            throw new Error('Individual order not found');
        }

        const order = item.individualOrders[orderIndex];

        // Check authorization
        if (order.user.toString() !== req.session.user.id && 
            item.createdBy.toString() !== req.session.user.id) {
            throw new Error('Not authorized');
        }

        // Remove the order
        item.individualOrders.splice(orderIndex, 1);

        // Recalculate delivery fee shares if there are remaining orders
        if (item.individualOrders.length > 0) {
            const newDeliveryFeeShare = item.deliveryFee / item.individualOrders.length;
            item.individualOrders.forEach(order => {
                order.totalAmount = order.subtotal + newDeliveryFeeShare;
            });
        }

        await item.save();

        res.redirect(`/items/${item._id}`);
    } catch (err) {
        console.error('Error removing order:', err);
        res.render('error', { message: 'Error removing order', error: err });
    }
});

// Update payment amount
router.post('/:id/update-payment/:orderId', requireLogin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('restaurant')
            .populate('createdBy')
            .populate('individualOrders.user');
        
        if (!item) {
            throw new Error('Order not found');
        }

        if (item.createdBy._id.toString() !== req.session.user.id) {
            throw new Error('Not authorized');
        }

        const { amountPaid } = req.body;
        if (typeof amountPaid !== 'number' || amountPaid < 0) {
            throw new Error('Invalid amount');
        }

        // Update payment
        item.updatePayment(req.params.orderId, amountPaid);
        await item.save();

        // Update user's payment history
        const order = item.individualOrders.id(req.params.orderId);
        if (order) {
            const user = await User.findById(order.user);
            const payment = user.paymentHistory.find(p => 
                p.orderId.toString() === item._id.toString()
            );

            if (payment) {
                payment.status = order.paid ? 'paid' : 'unpaid';
                payment.paidAt = order.paid ? new Date() : null;
                await user.save();
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Mark as delivered
router.post('/:id/deliver', requireLogin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            throw new Error('Order not found');
        }

        if (item.createdBy.toString() !== req.session.user.id) {
            throw new Error('Not authorized');
        }

        item.markDelivered();
        await item.save();

        res.redirect(`/items/${item._id}`);
    } catch (err) {
        console.error('Error marking as delivered:', err);
        res.render('error', { message: 'Error marking as delivered', error: err });
    }
});

// Close item
router.post('/:id/close', requireLogin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            throw new Error('Order not found');
        }

        if (item.createdBy.toString() !== req.session.user.id) {
            throw new Error('Not authorized');
        }

        item.status = 'closed';
        await item.save();

        res.redirect(`/items/${item._id}`);
    } catch (err) {
        console.error('Error closing order:', err);
        res.render('error', { message: 'Error closing order', error: err });
    }
});

// View payments
router.get('/:id/payments', requireLogin, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('restaurant')
            .populate('createdBy')
            .populate('individualOrders.user');

        if (!item) {
            throw new Error('Order not found');
        }

        if (item.createdBy._id.toString() !== req.session.user.id) {
            throw new Error('Not authorized');
        }

        res.render('items/payment-summary', { item, isCreator: true });
    } catch (err) {
        console.error('Error loading payment summary:', err);
        res.render('error', { message: 'Error loading payment summary', error: err });
    }
});

module.exports = router;