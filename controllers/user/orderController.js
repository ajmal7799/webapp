const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Cart = require("../../models/cartSchema");
const Coupon = require("../../models/couponSchema");
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Wallet = require("../../models/walletSchema");
const { type } = require("os");


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
        const userId = req.user._id;
        const { selectedAddress, paymentMethod, couponCode } = req.body;

        console.log(paymentMethod, "paymentMethod")
        // console.log(useFullWallet,"useFullWallet")

        const cart = await Cart.findOne({ userId }).populate("books.product");
        if (!cart || cart.books.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        let discountTotalPrice = 0;

        const address = await Address.findById(selectedAddress);
        if (!address) {
            return res.status(400).json({
                success: false,
                message: "Invalid address"
            });
        }

        let subtotal = 0;
        const productUpdates = [];

        for (const item of cart.books) {
            if (item.availableQuantity > item.product.availableQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.product.title}`
                });
            }

            discountTotalPrice += (item.product.regularPrice - item.product.discountPrice) * item.availableQuantity;


            subtotal += item.product.regularPrice * item.availableQuantity;

            productUpdates.push({
                updateOne: {
                    filter: { _id: item.product._id },
                    update: {
                        $inc: { availableQuantity: -item.availableQuantity }
                    }
                }
            });
        }

        const shippingCost = 40;
        let discount = 0;
        let totalAmount = subtotal + shippingCost;
        let couponApplied = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({
                name: couponCode,
                isList: true,
                createon: { $lte: new Date() },
                expireOn: { $gte: new Date() }
            });

            if (coupon && subtotal >= coupon.minimumPrice) {
                const usageCount = await Order.countDocuments({
                    'couponApplied': couponCode,
                    'userId': userId
                });

                if (usageCount < coupon.UsageLimit) {
                    if (coupon.isPercentage) {
                        discount = (subtotal * coupon.offerPrice) / 100;
                        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                            discount = coupon.maxDiscount;
                        }
                    } else {
                        discount = coupon.offerPrice;
                    }

                    totalAmount = subtotal + shippingCost - discount;
                    couponApplied = couponCode;
                }
            }
        }

        // let walletAmountUsed = 0;
        // if (paymentMethod === 'wallet') {
        //     const user = await User.findById(userId);
        //     if (!user) {
        //         return res.status(400).json({
        //             success: false,
        //             message: "User not found"
        //         });
        //     }

        //     if (user.walletBalance === undefined || user.walletBalance === null) {
        //         user.walletBalance = 0;
        //         await user.save();
        //     }

        //     if (user.walletBalance < totalAmount) {
        //         return res.status(400).json({
        //             success: false,
        //             message: `Insufficient wallet balance. Available balance: ₹${user.walletBalance}`
        //         });
        //     }
        //     // if (user.walletBalance === undefined || user.walletBalance === null || user.walletBalance < totalAmount) {
        //     //     return res.status(400).json({
        //     //         success: false,
        //     //         message: "Insufficient wallet balance"
        //     //     });
        //     // }
        //     walletAmountUsed = totalAmount;
        //     totalAmount = 0;
        // }

        const orderData = {
            userId,
            products: cart.books.map(item => ({
                productdiscount: Math.abs(discountTotalPrice),
                product: item.product._id,
                quantity: item.availableQuantity,
                price: item.product.regularPrice,
                orderStatus: 'pending'
            })),
            shippingAddress: {
                userId: address.user_id,
                city: address.city,
                state: address.state,
                pin_code: address.pin_code,
                landmark: address.landmark,
                alternative_no: address.alternative_no,
                addressType: address.addresstype
            },
            subtotal,
            shippingCost,
            discount,
            totalAmount,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            orderStatus: 'pending',
            couponApplied,
            // walletAmountUsed
        };

        if (paymentMethod === 'online' && totalAmount > 0) {
            const razorpayInstance = new Razorpay(
                {
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET
                }
            )
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: `order_${Date.now()}`,
                payment_capture: 1
            });

            orderData.razorpayOrderId = razorpayOrder.id;
            const order = new Order(orderData);
            await order.save();

            if (productUpdates.length > 0) {
                await Product.bulkWrite(productUpdates);
            }

            return res.json({
                success: true,
                orderId: order._id,
                razorpay: {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    keyId: process.env.RAZORPAY_KEY_ID
                }
            });
        } else if (paymentMethod === 'cod') {

            orderData.paymentStatus = 'pending';
            orderData.orderStatus = 'pending';

            const order = new Order(orderData);
            await order.save();

            if (productUpdates.length > 0) {
                await Product.bulkWrite(productUpdates);
            }

            await Cart.findOneAndDelete({ userId });

            return res.json({
                success: true,
                orderId: order._id,
                message: 'Order placed successfully with Cash on Delivery',
                orderDetails: {
                    subtotal,
                    shippingCost,
                    discount,
                    totalAmount
                }
            });
        }

        const wallets = await Wallet.find({});

        
        const sumofcredit = wallets.reduce((sum, element) => {
            if(element.type === "Credit") {
                return sum + element.amount;
            }
            return sum;
        }, 0);
        
        
        const sumofdebit = wallets.reduce((sum, element) => {
            if(element.type === "Debit") {
                return sum + element.amount;
            }
            return sum;
        }, 0);
        
        const totalBalanceAmount = sumofcredit - sumofdebit;
        
        if(paymentMethod === 'wallet') {
            if(totalAmount - discount > totalBalanceAmount) {
                return res.json({
                    success: false,
                    message: "Insufficient wallet balance"
                });
            }
            
          
            const newWallet = new Wallet({
                description: 'Order Payment',
                type: 'Debit',
                amount: totalAmount - discount,
                userId: userId,
            });
            await newWallet.save();
            
            
            const order = new Order(orderData);
            await order.save();
            
            
            if (productUpdates.length > 0) {
                await Product.bulkWrite(productUpdates);
            }
            
            
            await Cart.findOneAndDelete({ userId });
            
            
            return res.json({
                success: true,
                orderId: order._id,
                message: "Order placed successfully using Wallet Payment",
                orderDetails: {
                    subtotal,
                    shippingCost,
                    discount,
                    totalAmount,
                }
            });
        }
        

    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error placing order',
            error: error.message
        });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
          
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                    $set: {
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                        paymentStatus: 'completed'
                    }
                },
                { new: true }
            );

            if (order) {
               
                await Cart.findOneAndDelete({ userId: order.userId });

                return res.json({
                    success: true,
                    orderId: order._id
                });
            }
        }

        throw new Error('Payment verification failed');

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const order = await Order.findById(orderId).populate('products.product').populate("userId");
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
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);

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

        if (order.paymentMethod === 'online' || order.paymentMethod === 'wallet') {
            const newWallet = new Wallet({
                description: 'Order Cancel',
                type: 'Credit',
                amount: order.totalAmount,
                userId: order.userId
            });
            await newWallet.save();
        }


        return res.status(200).json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({ error: 'Order cancellation failed' });
    }
};

const returnOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const orderItem = order.products.find(
            product => product.product.toString() === productId
        );

        if (!orderItem) {
            return res.status(404).json({
                success: false,
                error: 'Product not found in order'
            });
        }

        if (order.orderStatus !== 'delivered') {
            return res.status(400).json({
                success: false,
                error: 'Only delivered orders can be returned'
            });
        }

        orderItem.orderStatus = 'returned';

        const allReturned = order.products.every(product => product.orderStatus === 'returned');
        if (allReturned) {
            order.orderStatus = 'returned';
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Product returned successfully'
        });

    } catch (error) {
        console.error('Error returning order:', error);
        return res.status(500).json({
            success: false, 
            error: 'Order return failed'
        });
    }
}; 

module.exports = {
    getOrder,
    placeOrder,
    getOrderDetails,
    cancelOrder,
    returnOrder,
    verifyPayment,
}

