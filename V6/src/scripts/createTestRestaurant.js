require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

async function createTestRestaurant() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/group-order-system');
        console.log('Connected to MongoDB');

        // Remove existing test restaurant if exists
        await Restaurant.deleteOne({ name: 'Pizza Place' });
        console.log('Removed existing test restaurant');

        // Create test restaurant
        const restaurant = new Restaurant({
            name: 'Pizza Place',
            cuisine: 'Italian',
            phone: '+1 555-0123',
            address: {
                street: '123 Main St',
                city: 'Springfield',
                state: 'IL',
                zipCode: '62701'
            },
            deliveryFee: 5.00,
            menuItems: [
                {
                    name: 'Margherita Pizza',
                    description: 'Fresh tomatoes, mozzarella, and basil',
                    price: 12.99,
                    category: 'Pizza'
                },
                {
                    name: 'Pepperoni Pizza',
                    description: 'Classic pepperoni with mozzarella',
                    price: 14.99,
                    category: 'Pizza'
                },
                {
                    name: 'Garlic Bread',
                    description: 'Toasted bread with garlic butter',
                    price: 4.99,
                    category: 'Sides'
                },
                {
                    name: 'Caesar Salad',
                    description: 'Romaine lettuce with Caesar dressing',
                    price: 7.99,
                    category: 'Salads'
                }
            ]
        });

        await restaurant.save();
        console.log('Test restaurant created successfully');
        console.log('Restaurant ID:', restaurant._id);
        console.log('Restaurant Details:', {
            name: restaurant.name,
            cuisine: restaurant.cuisine,
            phone: restaurant.phone,
            address: restaurant.address,
            deliveryFee: restaurant.deliveryFee,
            menuItems: restaurant.menuItems.length + ' items'
        });

    } catch (err) {
        console.error('Error creating test restaurant:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
createTestRestaurant();