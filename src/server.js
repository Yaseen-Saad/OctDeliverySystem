require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const MongoStore = require('connect-mongo');
const { addUserToLocals } = require('./middleware/auth');

const app = express();

// Connect to MongoDB first
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/group-order-system')
    .then(() => {
        console.log('Connected to MongoDB successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if cannot connect to database
    });

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Express layouts setup
app.use(expressLayouts);
app.set('layout', 'layout');

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secure-session-secret',
    name: 'groupOrderSession',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/group-order-system',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60, // 1 day in seconds
        autoRemove: 'native',
        touchAfter: 24 * 3600 // 24 hours in seconds
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
};

// Production settings
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    sessionConfig.cookie.secure = true;
}

// Initialize session middleware
app.use(session(sessionConfig));

// Add user to res.locals for all views
app.use(addUserToLocals);

// Add default layout variables
app.use((req, res, next) => {
    // Set default layout variables
    res.locals.title = 'OCT Delivery System';
    res.locals.body = ''; // Initialize body variable
    next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/items', require('./routes/items'));
app.use('/restaurants', require('./routes/restaurants'));
app.use('/admin', require('./routes/admin'));

// Root redirect
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/items');
    } else {
        res.redirect('/login');
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page not found',
        error: { status: 404 }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).render('error', {
        message: err.message || 'Something went wrong',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});