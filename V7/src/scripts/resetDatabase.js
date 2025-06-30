require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Item = require('../models/Item');

const resetDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crud-api');
    
    // Clear all existing data
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Item.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create regular users
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

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username}`);
    }

    // Create sample restaurants
    const restaurants = [
      {
        name: "Pizza Paradise",
        description: "Best pizza in town with authentic Italian recipes",
        cuisine: "Italian",
        address: "123 Main St",
        phone: "555-0123",
        openingHours: "11:00 AM - 11:00 PM",
        rating: 4.5,
        menuImage: "https://example.com/pizza-menu.jpg",
        deliveryFee: 5.00,
        menuItems: [
          {
            name: "Margherita Pizza",
            description: "Fresh tomatoes, mozzarella, basil",
            price: 12.99,
            category: "main"
          },
          {
            name: "Pepperoni Pizza",
            description: "Classic pepperoni with extra cheese",
            price: 14.99,
            category: "main"
          },
          {
            name: "Garlic Bread",
            description: "Freshly baked with herbs",
            price: 4.99,
            category: "appetizer"
          },
          {
            name: "Tiramisu",
            description: "Classic Italian dessert",
            price: 6.99,
            category: "dessert"
          }
        ]
      },
      {
        name: "Burger Bliss",
        description: "Gourmet burgers made with premium ingredients",
        cuisine: "American",
        address: "456 Oak Ave",
        phone: "555-0456",
        openingHours: "10:00 AM - 10:00 PM",
        rating: 4.3,
        menuImage: "https://example.com/burger-menu.jpg",
        deliveryFee: 4.00,
        menuItems: [
          {
            name: "Classic Cheeseburger",
            description: "Beef patty with cheddar cheese",
            price: 9.99,
            category: "main"
          },
          {
            name: "Loaded Fries",
            description: "With cheese, bacon, and ranch",
            price: 6.99,
            category: "appetizer"
          },
          {
            name: "Milkshake",
            description: "Choice of vanilla, chocolate, or strawberry",
            price: 4.99,
            category: "beverage"
          }
        ]
      },
      {
        name: "Sushi Sensation",
        description: "Fresh and authentic Japanese cuisine",
        cuisine: "Japanese",
        address: "789 Pine St",
        phone: "555-0789",
        openingHours: "11:30 AM - 10:00 PM",
        rating: 4.7,
        menuImage: "https://example.com/sushi-menu.jpg",
        deliveryFee: 6.00,
        menuItems: [
          {
            name: "California Roll",
            description: "Crab, avocado, cucumber",
            price: 8.99,
            category: "main"
          },
          {
            name: "Miso Soup",
            description: "Traditional Japanese soup",
            price: 3.99,
            category: "appetizer"
          },
          {
            name: "Green Tea Ice Cream",
            description: "Authentic matcha flavor",
            price: 5.99,
            category: "dessert"
          }
        ]
      }
    ];

    await Restaurant.insertMany(restaurants);
    console.log('Created sample restaurants');

    console.log('Database reset complete!');
    console.log('\nAvailable accounts:');
    console.log('Admin: admin/admin123');
    console.log('Users: user1/user123, user2/user123, user3/user123');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await mongoose.connection.close();
  }
};

resetDatabase();