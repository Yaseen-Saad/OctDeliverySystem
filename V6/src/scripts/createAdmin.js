require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI;

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Delete existing admin if exists
    await User.deleteOne({ username: 'admin' });
    console.log('Removed any existing admin user');

    // Create the password hash in the old format (sha256)
    const password = 'admin123'; // or process.env.ADMIN_PASSWORD
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Create admin user matching the exact structure from your database
    const adminUser = new User({
      username: 'admin',
      // Set the hashed password directly to skip the pre-save middleware
      password: hashedPassword,
      name: 'System Admin',
      phoneNumber: '01000000000',
      roomNumber: 'A219',
      isAdmin: true,
      paymentHistory: [],
      preferences: {},
      previousOrders: [],
      statistics: {
        totalOrders: 0,
        totalSpent: 0,
        favoriteRestaurants: [],
        mostOrderedItems: []
      }
    });

    // Save without triggering the password hash middleware
    await User.collection.insertOne(adminUser.toObject());
    
    console.log('\nAdmin user created successfully:');
    console.log('Username:', adminUser.username);
    console.log('Name:', adminUser.name);
    console.log('Room:', adminUser.roomNumber);
    console.log('Phone:', adminUser.phoneNumber);
    console.log('Is Admin:', adminUser.isAdmin);

    console.log('\nYou can now login with:');
    console.log('Username: admin');
    console.log('Password:', password);

    // Verify the password works
    const verifyUser = await User.findOne({ username: 'admin' });
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
};

createAdmin();