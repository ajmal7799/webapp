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
const PDFDocument = require('pdfkit');



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
        console.log(orders)
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
            await Cart.findOneAndDelete({ userId });

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

            if (totalAmount > 1000) {
                return res.status(400).json({
                    message: "Cash on Delivery is only available for orders below ₹1000. Please select another Payment method"
                });
            }

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

        const wallets = await Wallet.find({ userId });


        const sumofcredit = wallets.reduce((sum, element) => {
            if (element.type === "Credit") {
                return sum + element.amount;
            }
            return sum;
        }, 0);


        const sumofdebit = wallets.reduce((sum, element) => {
            if (element.type === "Debit") {
                return sum + element.amount;
            }
            return sum;
        }, 0);

        const totalBalanceAmount = sumofcredit - sumofdebit;

        if (paymentMethod === 'wallet') {
            if (totalAmount - discount > totalBalanceAmount) {
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
                balance: totalBalanceAmount,
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
    console.log("🔵 Payment verification function triggered!");

    try {
        console.log("🟢 Request body:", req.body);

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        // Early validation with detailed logging
        if (!razorpay_order_id || !razorpay_payment_id) {
            const errorMsg = `Missing required fields: ${!razorpay_order_id ? 'order_id' : ''} ${!razorpay_payment_id ? 'payment_id' : ''}`;
            console.error("❌ Validation Error:", errorMsg);
            return res.status(400).json({ success: false, message: "Invalid payment data" });
        }

        console.log("🟡 Searching for order in the database...");
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

        if (!order) {
            console.error("❌ Database Error: Order not found for Razorpay Order ID:", razorpay_order_id);
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        console.log("🟡 Verifying Razorpay signature...");
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isSignatureValid = expectedSignature === razorpay_signature;
        console.log("🟡 Signature verification result:", isSignatureValid ? "Valid" : "Invalid");

        if (isSignatureValid) {
            console.log("✅ Payment verified successfully!");
            const updatedOrder = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { $set: { paymentStatus: "completed", orderStatus: "processing" } },
                { new: true }
            );
            console.log("✅ Order updated as completed:", updatedOrder);
            return res.json({ success: true, orderId: order._id });
        }

        // If signature verification fails
        console.error("❌ Payment verification failed! Invalid signature");
        console.error("Expected:", expectedSignature);
        console.error("Received:", razorpay_signature);

        const failedOrder = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            { $set: { 
                paymentStatus: "failed", 
                orderStatus: "cancelled",
                paymentError: "Signature verification failed"
            }},
            { new: true }
        );
        console.error("❌ Order updated as failed:", failedOrder);

        return res.status(400).json({ success: false, message: "Payment verification failed", orderId: failedOrder._id });

    } catch (error) {
        console.error("❌ Error during payment verification:", {
            message: error.message,
            stack: error.stack,
            orderId: req.body.razorpay_order_id
        });

        try {
            const errorUpdate = await Order.findOneAndUpdate(
                { razorpayOrderId: req.body.razorpay_order_id },
                { $set: { 
                    paymentStatus: "failed", 
                    orderStatus: "cancelled", 
                    paymentError: error.message 
                }},
                { new: true }
            );
            console.error("❌ Order updated with error details:", errorUpdate);
            return res.status(500).json({ success: false, message: "Payment verification failed due to server error", orderId: errorUpdate._id });
        } catch (dbError) {
            console.error("❌ Failed to update order with error:", dbError);
            return res.status(500).json({ success: false, message: "Payment verification failed due to server error" });
        }
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

        if (order.paymentMethod === 'online' || order.paymentMethod === 'waller') {
            const newWallet = new Wallet({
                description: 'Order Return',
                type: 'Credit',
                amount: order.totalAmount,
                userId: order.userId
            })
            newWallet.save();
        }

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

const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('products.product').populate("shippingAddress");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

        doc.pipe(res);

        doc.fontSize(30).text('WordSphere', { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12)
            .text(`Order ID: ${order._id}`)
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
            .moveDown();

        doc.fontSize(14).text('Shipping Address:');
        doc.fontSize(12)
            .text(`${order.shippingAddress.addressType} Address`)
            .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pin_code}`)
            .text(`Landmark: ${order.shippingAddress.landmark}`)
            .moveDown();

        doc.fontSize(14).text('Products:');
        let y = doc.y + 20;

        doc.fontSize(12);
        doc.text('Product', 50, y);
        doc.text('Price', 250, y);
        doc.text('Qty', 350, y);
        doc.text('Total', 450, y);

        y += 20;

        order.products.forEach(item => {
            doc.text(item.product.name, 50, y);
            doc.text(`₹${item.price.toFixed(2)}`, 250, y);
            doc.text(item.quantity.toString(), 350, y);
            doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 450, y);
            y += 20;
        });

        doc.moveDown();

        doc.fontSize(14).text('Order Summary:', 50, y + 20);
        y += 40;

        doc.fontSize(12)
            .text(`Subtotal: ₹${(order.totalAmount + order.discount).toFixed(2)}`, 50, y)
            .text(`Discount: ₹${order.discount.toFixed(2)}`, 50, y + 20)
            .text(`Shipping: ₹40.00`, 50, y + 40)
            .fontSize(14)
            .text(`Total Amount: ₹${order.totalAmount}`, 50, y + 70);

        doc.fontSize(10)
            .text('Thank you for shopping with us!', 50, doc.page.height - 50, {
                align: 'center'
            });

        doc.end();




    } catch (error) {

        console.error(error);
        res.status(500).json({ message: "Error generating invoice" })

    }
}

const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId, status, error } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "Order ID and status are required" });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        order.paymentStatus = status;
        if (error) {
            order.paymentError = error;
        }

        await order.save();

        return res.json({ success: true, message: "Payment status updated successfully" });
    } catch (error) {
        console.error("Error updating payment status:", error);
        return res.status(500).json({ success: false, message: "Error updating payment status" });
    }
};

const initiateRepayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus !== 'failed') {
            return res.status(400).json({ success: false, message: 'Only failed payments can be repaid' });
        }

        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: Math.round(order.totalAmount * 100),
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            payment_capture: 1
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.json({
            success: true,
            razorpay: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        console.error('Error initiating repayment:', error);
        res.status(500).json({ success: false, message: 'Error initiating repayment' });
    }
};

module.exports = {
    getOrder,
    placeOrder,
    getOrderDetails,
    cancelOrder,
    returnOrder,
    verifyPayment,
    downloadInvoice,
    updatePaymentStatus,
    initiateRepayment
};

