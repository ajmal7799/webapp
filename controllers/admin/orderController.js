const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const { format } = require("path");

const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 7;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Order.find()
            .populate('userId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

            const formattedOrders = orders.map(order => ({
                ...order.toObject(),
                userId: order.userId || { email: 'User Deleted' }, // Provide fallback
                formatdate: order.formatdate || order.createdAt // Ensure date exists
            }));


        orders.forEach(element => {
            const date = String(element.createdAt.getDate());
            const month = String(element.createdAt.getMonth() + 1);
            const year = element.createdAt.getFullYear();
            element.formatdate = `${date}-${month}-${year}`;
        });

        res.render('order', {
            orders:formattedOrders,
            title: `Orders Management`,
            pagination: {
                page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: totalPages
            }
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('error', { message: 'Error retrieving order details' });
    }
}

const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('products.product');
        if (!order) {
            return res.status(404).render('error', {
                message: 'Order not found'
            });
        }
        res.render('order-detail', {
            order,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('error', { message: 'Error retrieving order details' });
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus === 'failed') {
            return res.status(400).json({ success: false, message: 'Cannot change order status when payment has failed' });
        }

        order.orderStatus = newStatus;
        if (newStatus === 'cancelled') {
            order.cancelTime = new Date();
        }
        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            updatedOrder: order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Error updating order status' });
    }
}

module.exports = {
    getOrders,
    orderDetails,
    updateOrderStatus
}