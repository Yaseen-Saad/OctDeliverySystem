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

// Password verification method
userSchema.methods.comparePassword = function(password) {
    // Create SHA-256 hash of the provided password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    // Compare with stored password
    return this.password === hashedPassword;
};

const User = mongoose.model('User', userSchema);

module.exports = User;