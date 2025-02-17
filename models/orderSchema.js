const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    products: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            default: 'pending'
        },
    }],
    shippingAddress: {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pin_code: {
            type: String,
            required: true
        },
        landmark: {
            type: String,
            required: true
        },
        alternative_no: {
            type: String
        },
        addressType: {
            type: String,
            enum: ["home", "office", "other"],
            required: true
        }
    },
    subtotal: {
        type: Number,
        required: true
    },
    shippingCost: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    productdiscount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'razorPay', 'online', 'wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed','cancelled'],
        default: 'pending'
    },
    paymentError: {
        type: String,
        default: null
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    couponApplied: {
        type: String
    },
    transactionId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    razorpayOrderId: {
        type: String
    },
    razorpaySignature: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;