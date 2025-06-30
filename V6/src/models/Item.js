const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorRoom: {
        type: String,
        required: true
    },
    deliveryTime: {
        type: Date,
        required: true
    },
    deliveryFee: {
        type: Number,
        required: true,
        default: 5.00
    },
    message: String,
    status: {
        type: String,
        enum: ['open', 'closed', 'delivered'],
        default: 'open'
    },
    individualOrders: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: [{
            name: String,
            price: Number,
            quantity: Number,
            note: String
        }],
        subtotal: Number,
        totalAmount: Number,
        specialInstructions: String,
        paid: {
            type: Boolean,
            default: false
        },
        amountPaid: {
            type: Number,
            default: 0
        },
        change: {
            type: Number,
            default: 0
        }
    }],
    deliveredAt: {
        type: Date
    },
    creatorChange: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total amount
itemSchema.virtual('subtotal').get(function() {
    return this.individualOrders.reduce((sum, order) => sum + order.subtotal, 0);
});

// Virtual for all paid status
itemSchema.virtual('allPaid').get(function() {
    return this.individualOrders.every(order => order.paid);
});

// Virtual for total amount paid
itemSchema.virtual('totalAmountPaid').get(function() {
    return this.individualOrders.reduce((sum, order) => sum + order.amountPaid, 0);
});

// Virtual for total change to give
itemSchema.virtual('totalChange').get(function() {
    return this.individualOrders.reduce((sum, order) => sum + order.change, 0);
});

// Method to mark as delivered
itemSchema.methods.markDelivered = function() {
    this.status = 'delivered';
    this.deliveredAt = new Date();
};

// Method to update payment
itemSchema.methods.updatePayment = function(orderId, amountPaid) {
    const order = this.individualOrders.id(orderId);
    if (!order) return;

    order.amountPaid = amountPaid;
    order.change = Math.max(0, amountPaid - order.totalAmount);
    order.paid = amountPaid >= order.totalAmount;

    // Update creator's change
    this.creatorChange = this.totalAmountPaid - (this.subtotal + this.deliveryFee);
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;