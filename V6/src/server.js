require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
const { requireLogin } = require('./middleware/auth');
const { requireAdmin } = require('./middleware/adminAuth');

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secure-session-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60, // 1 week
        autoRemove: 'native'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user;
    next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/items', requireLogin, require('./routes/items'));
app.use('/restaurants', requireLogin, require('./routes/restaurants'));

// Admin routes (protected by both login and admin middleware)
app.use('/admin', requireLogin, requireAdmin, require('./routes/admin'));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});