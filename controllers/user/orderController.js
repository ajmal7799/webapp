const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema")
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose');

const getOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 4;
        const skip = (page - 1) * limit;

        const userId = req.user._id;

        const totalOrders = await Order.countDocuments({ userId });

        const orders = await Order.find({ userId })
            .populate('products.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalOrders / limit);
        const userData = await User.findOne({ _id: req.session.user._id });
        // console.log(userData)

        res.render("orders", {
            orders,
            user: userData,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
        });


    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).render('error', { message: 'Error fetching orders' });
    }
};

const placeOrder = async (req, res) => {
    try {
        const { selectedAddress, paymentMethod } = req.body;

        const cart = await Cart.findOne({ userId: req.user._id }).populate('books.product');
        if (!cart || cart.books.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Add items to the cart before placing an order.' });
        }

        const address = await Address.findById(selectedAddress);
        if (!address) {
            return res.status(404).json({ error: 'Address not found. Please select a valid address.' });
        }

        const productUpdates = cart.books.map(async (item) => {
            const product = await Product.findById(item.product._id);

            if (!product) {
                throw new Error(`Product not found: ${item.product._id}`);
            }

            if (product.availableQuantity < item.availableQuantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }

            product.availableQuantity -= item.availableQuantity;
            await product.save();

            return {
                product: product._id,
                quantity: item.availableQuantity,
                price: product.regularPrice
            };
        });

        const processedProducts = await Promise.all(productUpdates);

        const totalAmount = processedProducts.reduce((total, item) => {
            return total + (item.price * item.quantity + 40);
        }, 0);

        const newOrder = new Order({
            userId: req.user._id,
            products: processedProducts,
            shippingAddress: {
                userId: req.user._id,
                city: address.city,
                state: address.state,
                pin_code: address.pin_code,
                landmark: address.landmark,
                alternative_no: address.alternative_no,
                addressType: address.addresstype,
            },
            totalAmount,
            paymentMethod,
            orderStatus: 'pending',
        });

        await newOrder.save();

        await Cart.findOneAndDelete({ userId: req.user._id });



        return res.status(200).json({
            orderId: newOrder._id,
            message: 'Order placed successfully...'
        });


    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).json({
            error: error.message || 'Order placement failed'
        });
    }
};


const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const order = await Order.findById(orderId).populate('products.product')
        if (!order) {
            return res.status(404).render('error', {
                message: 'Order not found'
            });
        }

            res.render('order-details', {
                order,
                title: `Order #${orderId}`
            });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('error', {
            message: 'Unable to fetch order details'
        });

    }
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const order = await Order.findById(orderId);
        console.log("order",orderId)

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.orderStatus !== 'pending') {
            return res.status(400).json({ error: 'Only pending orders can be cancelled' });
        }

        for (let item of order.products) {
            const product = await Product.findById(item.product);
            if (product) {
                product.availableQuantity += item.quantity;
                await product.save();
            }
        }
        order.orderStatus = 'cancelled';
        await order.save(); 

        return res.status(200).json({ message: 'Order cancelled successfully' });

    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({ error: 'Order cancellation failed' });

    }
}


module.exports = {
    getOrder,
    placeOrder,
    getOrderDetails,
    cancelOrder,

}

