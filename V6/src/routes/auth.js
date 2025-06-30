const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/items');
    }
    res.render('login', { error: null });
});

// Login process
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = user.comparePassword(password);
        if (!isValid) {
            console.log('Invalid password for user:', username);
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Set session
        req.session.user = {
            id: user._id,
            username: user.username,
            name: user.name,
            phoneNumber: user.phoneNumber,
            roomNumber: user.roomNumber,
            isAdmin: user.isAdmin,
            preferences: user.preferences
        };

        res.redirect('/items');
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'An error occurred during login' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;