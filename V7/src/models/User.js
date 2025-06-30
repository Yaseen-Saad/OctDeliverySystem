const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentHistorySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    restaurantName: String,
    amount: Number,
    deliveryFee: Number,
    paidAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['paid', 'unpaid'],
        default: 'unpaid'
    }
}, { timestamps: true });

const previousOrderSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    restaurantName: String,
    items: [{
        name: String,
        price: Number,
        quantity: Number,
        note: String
    }],
    subtotal: Number,
    deliveryFee: Number,
    totalAmount: Number,
    orderedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    roomNumber: {
        type: String,
        required: true,
        trim: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        }
    },
    paymentHistory: [paymentHistorySchema],
    previousOrders: [previousOrderSchema],
    statistics: {
        totalOrders: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        favoriteRestaurants: [{
            restaurantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Restaurant'
            },
            name: String,
            orderCount: {
                type: Number,
                default: 0
            },
            totalSpent: {
                type: Number,
                default: 0
            }
        }],
        mostOrderedItems: [{
            name: String,
            quantity: {
                type: Number,
                default: 0
            },
            totalSpent: {
                type: Number,
                default: 0
            }
        }]
    }
}, {
    timestamps: true
});

// Simple SHA-256 hash for passwords
function hashPassword(password) {
    console.log('[DEBUG] Hashing password');
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Hash password before saving
userSchema.pre('save', function(next) {
    console.log('[DEBUG] Pre-save hook triggered');
    if (!this.isModified('password')) {
        console.log('[DEBUG] Password not modified, skipping hash');
        return next();
    }
    
    console.log('[DEBUG] Password modified, hashing');
    this.password = hashPassword(this.password);
    next();
});

// Password verification method
userSchema.methods.comparePassword = function(password) {
    console.log('[DEBUG] Comparing passwords');
    console.log('[DEBUG] Stored password format:', this.password);
    
    const hashedPassword = hashPassword(password);
    console.log('[DEBUG] Input password hashed:', hashedPassword);
    
    const isMatch = this.password === hashedPassword;
    console.log('[DEBUG] Password match:', isMatch);
    
    return isMatch;
};

// Update statistics method
userSchema.methods.updateStatistics = function(order) {
    // Update total orders and spent
    this.statistics.totalOrders++;
    this.statistics.totalSpent += order.totalAmount;

    // Update favorite restaurants
    const restaurantIndex = this.statistics.favoriteRestaurants.findIndex(
        r => r.restaurantId.toString() === order.restaurantId.toString()
    );

    if (restaurantIndex >= 0) {
        this.statistics.favoriteRestaurants[restaurantIndex].orderCount++;
        this.statistics.favoriteRestaurants[restaurantIndex].totalSpent += order.totalAmount;
    } else {
        this.statistics.favoriteRestaurants.push({
            restaurantId: order.restaurantId,
            name: order.restaurantName,
            orderCount: 1,
            totalSpent: order.totalAmount
        });
    }

    // Update most ordered items
    order.items.forEach(item => {
        const itemIndex = this.statistics.mostOrderedItems.findIndex(i => i.name === item.name);
        if (itemIndex >= 0) {
            this.statistics.mostOrderedItems[itemIndex].quantity += item.quantity;
            this.statistics.mostOrderedItems[itemIndex].totalSpent += (item.price * item.quantity);
        } else {
            this.statistics.mostOrderedItems.push({
                name: item.name,
                quantity: item.quantity,
                totalSpent: item.price * item.quantity
            });
        }
    });

    // Sort favorites by order count
    this.statistics.favoriteRestaurants.sort((a, b) => b.orderCount - a.orderCount);

    // Sort most ordered items by quantity
    this.statistics.mostOrderedItems.sort((a, b) => b.quantity - a.quantity);

    // Keep only top 5 for each
    this.statistics.favoriteRestaurants = this.statistics.favoriteRestaurants.slice(0, 5);
    this.statistics.mostOrderedItems = this.statistics.mostOrderedItems.slice(0, 5);
};

const User = mongoose.model('User', userSchema);

module.exports = User;