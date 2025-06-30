require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/group-order-system');
        console.log('Connected to MongoDB');

        // Remove existing test user if exists
        await User.deleteOne({ username: 'john' });
        console.log('Removed existing test user');

        // Create test user
        const user = new User({
            username: 'john',
            password: 'john123', // Will be hashed by the model
            name: 'John Doe',
            phoneNumber: '+1 555-0123',
            roomNumber: '101',
            isAdmin: false,
            preferences: {
                theme: 'system'
            }
        });

        await user.save();
        console.log('Test user created successfully');
        console.log('Username: john');
        console.log('Password: john123');

    } catch (err) {
        console.error('Error creating test user:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
createTestUser();