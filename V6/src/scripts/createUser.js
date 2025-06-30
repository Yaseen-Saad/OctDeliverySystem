require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crud-api');
    
    // Create three users
    const users = [
      {
        username: 'user1',
        password: 'user123'
      },
      {
        username: 'user2',
        password: 'user123'
      },
      {
        username: 'user3',
        password: 'user123'
      }
    ];

    // Clear existing users (except admin)
    await User.deleteMany({ username: { $ne: 'admin' } });

    // Create new users
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username}`);
    }
  } catch (error) {
    if (error.code === 11000) {
      console.log('User already exists');
    } else {
      console.error('Error creating user:', error);
    }
  } finally {
    await mongoose.connection.close();
  }
};

createUser();