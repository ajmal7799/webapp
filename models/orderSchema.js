const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    products: [
        {
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
            }
        }
    ],
    totalAmount: {
        type: Number, 
        required: true
    },
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        addressLine1: {
            type: String,
            required: true
        },
        addressLine2: {
            type: String
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "Credit Card", "Debit Card", "Net Banking", "Wallet", "UPI"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    },
    orderStatus: {
        type: String,
        enum: ["Placed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
        default: "Placed"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    orderedAt: {
        type: Date,
        default: Date.now 
    },
    deliveredAt: {
        type: Date 
    }
}, {
    timestamps: true 
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;