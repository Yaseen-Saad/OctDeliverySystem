require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/group-order-system');
    console.log('Connected to MongoDB successfully');

    // Check if admin exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('\nFound existing admin user:');
      console.log('Username:', existingAdmin.username);
      console.log('Is Admin:', existingAdmin.isAdmin);
      console.log('Created At:', existingAdmin.createdAt);
      console.log('Deleted existing admin user');
      await User.deleteOne({ username: 'admin' });
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      name: 'System Admin',
      roomNumber: 'ADMIN',
      phoneNumber: '+1 217-555-0000',
      isAdmin: true
    });

    await adminUser.save();
    console.log('\nAdmin user created successfully:');
    console.log('Username:', adminUser.username);
    console.log('Name:', adminUser.name);
    console.log('Room:', adminUser.roomNumber);
    console.log('Phone:', adminUser.phoneNumber);
    console.log('Is Admin:', adminUser.isAdmin);
    console.log('Created At:', adminUser.createdAt);

    console.log('\nYou can now login with:');
    console.log('Username: admin');
    console.log('Password: admin123');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

createAdmin();