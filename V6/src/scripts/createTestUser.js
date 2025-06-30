require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');

const MONGODB_URI = 'mongodb+srv://application:1NduwRK0mEi4yyNS@cluster0.rpnhx.mongodb.net/test?retryWrites=true&w=majority&authSource=admin&ssl=true&connectTimeoutMS=30000&socketTimeoutMS=30000';

async function createTestUser() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        // Remove existing test user if exists
        await User.deleteOne({ username: 'testuser' });
        console.log('Removed existing test user');

        // Hash password using SHA-256 (old format)
        const password = 'test123';
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Create test user
        const user = new User({
            username: 'testuser',
            password: hashedPassword,
            name: 'Test User',
            phoneNumber: '01012345678',
            roomNumber: 'TEST101',
            isAdmin: false,
            preferences: {},
            paymentHistory: [],
            previousOrders: [],
            statistics: {
                totalOrders: 0,
                totalSpent: 0,
                favoriteRestaurants: [],
                mostOrderedItems: []
            }
        });

        // Save without triggering the password hash middleware
        await User.collection.insertOne(user.toObject());
        
        console.log('\nTest user created successfully:');
        console.log('Username:', user.username);
        console.log('Name:', user.name);
        console.log('Room:', user.roomNumber);
        console.log('Phone:', user.phoneNumber);
        console.log('Is Admin:', user.isAdmin);

        console.log('\nYou can now login with:');
        console.log('Username: testuser');
        console.log('Password: test123');

        // Verify the password works
        const verifyUser = await User.findOne({ username: 'testuser' });
        const isValid = verifyUser.comparePassword(password);
        if (isValid) {
            console.log('\nPassword verification successful');
        } else {
            console.error('\nWarning: Password verification failed');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

createTestUser();