const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const { format } = require("path");


const getOrders = async (req, res) => {
    try {
        
        
        const orders = await Order.find()
            .populate('userId')
            .sort({ createdAt: -1 });
        orders.forEach(element => {
            const date = String(element.createdAt.getDate())
            const month = String(element.createdAt.getMonth() + 1)
            const year = element.createdAt.getFullYear()
            return element.formatdate = `${date}-${month}-${year}`

        })

        res.render('order', {
            orders,
            title: `Order #${orders._id}`,
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

        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                orderStatus: newStatus,
                ...(newStatus === 'cancelled' && { cancelTime: new Date() }) 
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

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