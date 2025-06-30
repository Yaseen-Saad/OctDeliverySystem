require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Item = require('../models/Item');

const initializeDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Item.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create users
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        name: 'System Admin',
        phoneNumber: '01000000000',
        roomNumber: 'ADMIN'
      },
      {
        username: 'john',
        password: 'john123',
        name: 'John Smith',
        phoneNumber: '01111111111',
        roomNumber: 'A101'
      },
      {
        username: 'sarah',
        password: 'sarah123',
        name: 'Sarah Johnson',
        phoneNumber: '01222222222',
        roomNumber: 'B202'
      },
      {
        username: 'mike',
        password: 'mike123',
        name: 'Mike Wilson',
        phoneNumber: '01333333333',
        roomNumber: 'C303'
      }
    ];

    const createdUsers = await Promise.all(
      users.map(user => new User(user).save())
    );
    console.log('Created users:', users.map(u => u.username).join(', '));

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
        deliveryFee: 5.00,
        menuItems: [
          {
            name: "Margherita Pizza",
            description: "Fresh tomatoes, mozzarella, basil",
            price: 12.99,
            category: "pizza"
          },
          {
            name: "Pepperoni Pizza",
            description: "Classic pepperoni with extra cheese",
            price: 14.99,
            category: "pizza"
          },
          {
            name: "Garlic Bread",
            description: "Freshly baked with garlic butter",
            price: 4.99,
            category: "appetizer"
          },
          {
            name: "Caesar Salad",
            description: "Romaine lettuce, croutons, parmesan",
            price: 7.99,
            category: "salad"
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
        deliveryFee: 4.00,
        menuItems: [
          {
            name: "Classic Cheeseburger",
            description: "Beef patty with cheddar cheese",
            price: 9.99,
            category: "burger"
          },
          {
            name: "Bacon BBQ Burger",
            description: "With crispy bacon and BBQ sauce",
            price: 11.99,
            category: "burger"
          },
          {
            name: "Loaded Fries",
            description: "With cheese, bacon, and ranch",
            price: 6.99,
            category: "sides"
          },
          {
            name: "Onion Rings",
            description: "Crispy battered onion rings",
            price: 4.99,
            category: "sides"
          }
        ]
      },
      {
        name: "Sushi Sensation",
        description: "Fresh and authentic Japanese sushi",
        cuisine: "Japanese",
        address: "789 Pine St",
        phone: "555-0789",
        openingHours: "11:30 AM - 10:00 PM",
        rating: 4.7,
        deliveryFee: 6.00,
        menuItems: [
          {
            name: "California Roll",
            description: "Crab, avocado, cucumber",
            price: 8.99,
            category: "rolls"
          },
          {
            name: "Spicy Tuna Roll",
            description: "Fresh tuna with spicy sauce",
            price: 10.99,
            category: "rolls"
          },
          {
            name: "Miso Soup",
            description: "Traditional Japanese soup",
            price: 3.99,
            category: "soup"
          },
          {
            name: "Edamame",
            description: "Steamed soybeans with sea salt",
            price: 4.99,
            category: "appetizer"
          }
        ]
      }
    ];

    const createdRestaurants = await Restaurant.insertMany(restaurants);
    console.log('Created sample restaurants');

    // Create a sample group order with multiple individual orders
    const sampleOrder = new Item({
      restaurant: createdRestaurants[0]._id, // Pizza Paradise
      createdBy: createdUsers[0]._id, // admin
      creatorRoom: createdUsers[0].roomNumber, // Use admin's room number
      deliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      deliveryFee: createdRestaurants[0].deliveryFee,
      status: 'open',
      message: 'Test group order with multiple participants',
      individualOrders: [
        {
          user: createdUsers[1]._id, // john
          items: [
            {
              name: "Margherita Pizza",
              price: 12.99,
              quantity: 1
            }
          ],
          totalAmount: 12.99,
          paymentStatus: 'unpaid',
          amountPaid: 0,
          change: 0
        },
        {
          user: createdUsers[2]._id, // sarah
          items: [
            {
              name: "Pepperoni Pizza",
              price: 14.99,
              quantity: 1
            },
            {
              name: "Garlic Bread",
              price: 4.99,
              quantity: 2
            }
          ],
          totalAmount: 24.97,
          paymentStatus: 'change-due',
          amountPaid: 30.00,
          change: 5.03
        }
      ]
    });

    await sampleOrder.save();
    console.log('Created sample group order');

    console.log('\nDatabase initialization complete!');
    console.log('\nTest Users:');
    users.forEach(user => {
      console.log(`Name: ${user.name}`);
      console.log(`Username: ${user.username}`);
      console.log(`Password: ${user.password}`);
      console.log(`Phone: ${user.phoneNumber}`);
      console.log(`Room: ${user.roomNumber}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase();