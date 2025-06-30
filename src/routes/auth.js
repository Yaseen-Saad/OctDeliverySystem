const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login page
router.get('/login', (req, res) => {
    console.log('[DEBUG] GET /login - Session:', req.session);
    if (req.session.user) {
        console.log('[DEBUG] User already logged in, redirecting to /items');
        return res.redirect('/items');
    }
    res.render('login', { error: null });
});

// Login process
router.post('/login', async (req, res) => {
    console.log('[DEBUG] POST /login - Body:', req.body);
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username });
        console.log('[DEBUG] Found user:', user ? user.username : 'not found');
        
        if (!user) {
            console.log('[DEBUG] User not found:', username);
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await user.comparePassword(password);
        console.log('[DEBUG] Password valid:', isValid);
        
        if (!isValid) {
            console.log('[DEBUG] Invalid password for user:', username);
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Create new session
        req.session.regenerate((err) => {
            if (err) {
                console.error('[DEBUG] Session regeneration error:', err);
                return res.render('login', { error: 'Error during login' });
            }

            // Set session data
            req.session.user = {
                id: user._id,
                username: user.username,
                name: user.name,
                phoneNumber: user.phoneNumber,
                roomNumber: user.roomNumber,
                isAdmin: user.isAdmin,
                preferences: user.preferences
            };

            console.log('[DEBUG] Session user set:', req.session.user);

            // Save session explicitly
            req.session.save((err) => {
                if (err) {
                    console.error('[DEBUG] Session save error:', err);
                    return res.render('login', { error: 'Error during login' });
                }
                console.log('[DEBUG] Session saved, redirecting to /items');
                res.redirect('/items');
            });
        });
    } catch (err) {
        console.error('[DEBUG] Login error:', err);
        res.render('login', { error: 'An error occurred during login' });
    }
});

// Update theme preference
router.post('/preferences/theme', async (req, res) => {
    console.log('[DEBUG] POST /preferences/theme - Session:', req.session);
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { theme } = req.body;
        if (!['light', 'dark', 'system'].includes(theme)) {
            return res.status(400).json({ error: 'Invalid theme' });
        }

        // Update user preferences
        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.preferences.theme = theme;
        await user.save();

        // Update session
        req.session.user.preferences = user.preferences;
        
        // Save session before sending response
        req.session.save((err) => {
            if (err) {
                console.error('[DEBUG] Session save error:', err);
                return res.status(500).json({ error: 'Error saving preferences' });
            }
            res.json({ success: true, theme });
        });
    } catch (err) {
        console.error('[DEBUG] Theme update error:', err);
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Get current theme
router.get('/preferences/theme', (req, res) => {
    console.log('[DEBUG] GET /preferences/theme - Session:', req.session);
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    res.json({
        theme: req.session.user.preferences?.theme || 'system'
    });
});

// Logout
router.get('/logout', (req, res) => {
    console.log('[DEBUG] GET /logout - Session:', req.session);
    req.session.destroy((err) => {
        if (err) {
            console.error('[DEBUG] Logout error:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;