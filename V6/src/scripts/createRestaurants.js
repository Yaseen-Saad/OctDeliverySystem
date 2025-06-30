require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

const sampleRestaurants = [
  {
    name: "Pizza Place",
    cuisine: "Italian",
    address: {
      street: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zipCode: "62701"
    },
    phone: "+1 217-555-0123",
    deliveryFee: 5.00,
    menuItems: [
      {
        name: "Margherita Pizza",
        price: 12.99,
        description: "Fresh tomatoes, mozzarella, and basil",
        category: "Pizza"
      },
      {
        name: "Pepperoni Pizza",
        price: 14.99,
        description: "Classic pepperoni with mozzarella",
        category: "Pizza"
      },
      {
        name: "Garlic Bread",
        price: 4.99,
        description: "Toasted bread with garlic butter",
        category: "Sides"
      },
      {
        name: "Caesar Salad",
        price: 7.99,
        description: "Romaine lettuce with Caesar dressing",
        category: "Salads"
      }
    ],
    rating: {
      average: 4.5,
      count: 128
    }
  },
  {
    name: "Burger Joint",
    cuisine: "American",
    address: {
      street: "456 Oak Avenue",
      city: "Springfield",
      state: "IL",
      zipCode: "62702"
    },
    phone: "+1 217-555-0456",
    deliveryFee: 4.00,
    menuItems: [
      {
        name: "Classic Burger",
        price: 9.99,
        description: "Beef patty with lettuce, tomato, and onion",
        category: "Burgers"
      },
      {
        name: "Cheeseburger",
        price: 10.99,
        description: "Classic burger with American cheese",
        category: "Burgers"
      },
      {
        name: "French Fries",
        price: 3.99,
        description: "Crispy golden fries",
        category: "Sides"
      },
      {
        name: "Milkshake",
        price: 4.99,
        description: "Vanilla, chocolate, or strawberry",
        category: "Drinks"
      }
    ],
    rating: {
      average: 4.3,
      count: 95
    }
  },
  {
    name: "Sushi Bar",
    cuisine: "Japanese",
    address: {
      street: "789 Cherry Lane",
      city: "Springfield",
      state: "IL",
      zipCode: "62703"
    },
    phone: "+1 217-555-0789",
    deliveryFee: 6.00,
    menuItems: [
      {
        name: "California Roll",
        price: 8.99,
        description: "Crab, avocado, and cucumber",
        category: "Rolls"
      },
      {
        name: "Salmon Nigiri",
        price: 7.99,
        description: "Fresh salmon over rice",
        category: "Nigiri"
      },
      {
        name: "Miso Soup",
        price: 2.99,
        description: "Traditional Japanese soup",
        category: "Soups"
      },
      {
        name: "Green Tea",
        price: 2.49,
        description: "Hot Japanese green tea",
        category: "Drinks"
      }
    ],
    rating: {
      average: 4.7,
      count: 156
    }
  }
];

const createRestaurants = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/group-order-system');
    console.log('Connected to MongoDB');

    // Clear existing restaurants
    await Restaurant.deleteMany({});
    console.log('Cleared existing restaurants');

    // Create restaurants one by one
    for (const restaurantData of sampleRestaurants) {
      const restaurant = new Restaurant(restaurantData);
      await restaurant.save();
      console.log(`Created restaurant: ${restaurant.name}`);
      console.log(`- Address: ${restaurant.fullAddress}`);
      console.log(`- Phone: ${restaurant.formatPhoneNumber()}`);
      console.log(`- Menu items: ${restaurant.menuItems.length}`);
      
      // Log menu by category
      const menuByCategory = restaurant.getMenuByCategory();
      for (const [category, items] of Object.entries(menuByCategory)) {
        console.log(`  ${category}: ${items.length} items`);
      }
      console.log(`- Average item price: $${restaurant.getAveragePrice().toFixed(2)}\n`);
    }

    console.log('All restaurants created successfully');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

createRestaurants();