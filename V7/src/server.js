require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const MongoStore = require('connect-mongo');
const { addUserToLocals, requireLogin } = require('./middleware/auth');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

// Express layouts setup
app.use(expressLayouts);
app.set('layout', path.join('layout'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB first
console.log('[DEBUG] Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/group-order-system')
  .then(() => {
    console.log('[DEBUG] Connected to MongoDB successfully');
  })
  .catch(err => {
    console.error('[DEBUG] MongoDB connection error:', err);
  });

// Simplified session configuration
const store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/group-order-system',
    collectionName: 'sessions',
    stringify: false,
    autoRemove: 'native'
});

store.on('error', function(error) {
    console.error('[DEBUG] Session store error:', error);
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    },
    name: 'groupOrderSession'
}));

// Log all requests
app.use((req, res, next) => {
    console.log('[DEBUG] Request:', {
        method: req.method,
        url: req.url,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        user: req.session?.user
    });
    next();
});

// Add user to res.locals for all views
app.use(addUserToLocals);

// Routes
app.use('/', require('./routes/auth'));
app.use('/items', requireLogin, require('./routes/items'));
app.use('/restaurants', requireLogin, require('./routes/restaurants'));
app.use('/admin', requireLogin, require('./routes/admin'));

// Root redirect
app.get('/', (req, res) => {
    console.log('[DEBUG] Root redirect - Session:', {
        exists: !!req.session,
        user: req.session?.user,
        id: req.sessionID
    });
    
    if (req.session.user) {
        console.log('[DEBUG] Redirecting to /items');
        res.redirect('/items');
    } else {
        console.log('[DEBUG] Redirecting to /login');
        res.redirect('/login');
    }
});

// 404 handler
app.use((req, res) => {
    console.log('[DEBUG] 404 Not Found:', req.url);
    res.status(404).render('error', {
        message: 'Page not found',
        error: { status: 404 }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[DEBUG] Error:', err);
    res.status(err.status || 500).render('error', {
        message: err.message || 'Something went wrong',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`[DEBUG] Server is running on port ${port}`);
});