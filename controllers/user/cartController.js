const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose');
const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Coupon = require("../../models/couponSchema");
const Wallet = require("../../models/walletSchema");

const getCartPage = async (req, res) => {
    try {

        if (!req.session || !req.session.user) {
            return res.render('login', {
                message: 'Please login to access your cart'
            });
        }

        const userId = req.session.user;

        const cart = await Cart.findOne({ userId}).populate("books.product");
        const userData = await User.findOne({ _id:userId});

        if (!userData) {
            req.session.destroy();
            return res.render('login', {
                message: 'Please login to continue'
            });
        }

        // console.log(userData,"hello")
        res.render("cart", { cart,user:userData });
    } catch (error) {
        console.error(error);
        res.status(500).send("error fetching cart");
    }
};

const addToCart = async (req, res) => {
    try {
        

        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to add items to your cart'
            });
        }
       
        const { id } = req.body; 
        const userId =  req.session.user._id;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (product.availableQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Product is out of stock'
            });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({
                userId,
                books: [{
                    product: id,
                    availableQuantity: 1,
                }]
            });
        } else {
            const bookIndex = cart.books.findIndex(
                item => item.product.toString() === id
            );

            if (bookIndex > -1) {
                if (cart.books[bookIndex].availableQuantity < product.availableQuantity &&
                    cart.books[bookIndex].availableQuantity < 5) {
                    cart.books[bookIndex].availableQuantity += 1;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Maximum quantity reached or insufficient stock'
                    });
                }
            } else {
                if (product.availableQuantity > 0) {
                    cart.books.push({
                        product: id,
                        availableQuantity: 1
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Product is out of stock'
                    });
                }
            }
        }

        await cart.save();

        res.json({
            success: true,
            message: 'Product added to cart successfully'
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding product to cart'
        });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const result = await Cart.updateOne(
            { userId },
            { $pull: { books: { product: new mongoose.Types.ObjectId(productId) } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart'
            });
        }

        res.json({ success: true, message: "Product removed from cart" });

    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({
            success: false,
            message: "Error removing product from cart"
        });
    }
};
 
const updateCartQuantity = async (req, res) => {
    try {
        const { productId, action } = req.body;
        const userId = req.user._id;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const bookIndex = cart.books.findIndex(item => item.product.toString() === productId);
        if (bookIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (action === 'increase') {
            if (cart.books[bookIndex].availableQuantity < product.availableQuantity && cart.books[bookIndex].availableQuantity < 5) {
                cart.books[bookIndex].availableQuantity += 1;
            } else {
                return res.status(400).json({ success: false, message: 'Maximum quantity reached or insufficient stock' });
            }
        } else if (action === 'decrease') {
            if (cart.books[bookIndex].availableQuantity > 1) {
                cart.books[bookIndex].availableQuantity -= 1;
            } else {
                return res.status(400).json({ success: false, message: 'Minimum quantity reached' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        await cart.save();

        res.json({ success: true, availableQuantity: cart.books[bookIndex].availableQuantity });
    } catch (error) {
        console.error('Update cart quantity error:', error);
        res.status(500).json({ success: false, message: 'Error updating cart quantity' });
    }
};


// checkout page

const getCheckoutPage = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId }).populate({ path: 'books.product', model: 'Product' });
        const addresses = await Address.find({ user_id: userId });
        const currentDate = new Date();
        const coupon = await Coupon.find({
            expireOn: { $gt: currentDate },
            isList:true,  
            $or: [
                { UsageLimit: { $gt: 0 } },
                { UsageLimit: { $exists: false } },
                {isList:false}
            ]
            }); 
 

        // console.log(coupon)
    

        const userData = await User.findOne({_id:req.session.user._id});



       const wallets = await Wallet.find({userId})
       
       const sumofcredit = wallets.reduce((sum,element)=>{
         if(element.type === "Credit"){
            return sum + element.amount
         }
         return sum
       },0)

       const sumofdebit = wallets.reduce((sum, element) => {
        if (element.type === "Debit") {
            return sum + element.amount;
        }
        return sum;
    }, 0);


        const totalBalanceAmount = sumofcredit - sumofdebit;

        console.log("wallet",totalBalanceAmount)



                

            res.render('checkout', {
                cart,
                addresses,
                title: 'Checkout',
                user:userData,
                coupon:coupon,
                totalBalanceAmount:totalBalanceAmount

            });
    } catch (error) {
        console.error('Checkout page error:', error);
        req.flash('error', 'Error loading checkout page');
        res.redirect('/cart');
    }
}

const applyCoupon = async (req, res) => {
    try {
        const { couponCode, totalAmount } = req.body;
        const userId = req.user._id;

        const coupon = await Coupon.findOne({
            name: couponCode,
            isList: true,
            createon: { $lte: new Date() },
            expireOn: { $gte: new Date() }
        });

        if (!coupon) {
            return res.json({ success: false, message: "Invalid or expired coupon" });
        }

        if (totalAmount < coupon.minimumPrice) {
            return res.json({
                success: false,
                message: `Minimum purchase amount of ₹${coupon.minimumPrice} required`
            });
        }

        const usageCount = await Order.countDocuments({
            'couponApplied': couponCode
        });

        if (usageCount >= coupon.UsageLimit) {
            return res.json({
                success: false,
                message: 'Coupon usage limit exceeded'
            });
        }

     
        let discountAmount = 0;
        if (coupon.isPercentage) {
            discountAmount = (totalAmount * coupon.offerPrice) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.offerPrice;
        }

        const discountedAmount = totalAmount - discountAmount;

        res.json({
            success: true,
            coupon,
            originalAmount: totalAmount,
            discountAmount,
            discountedAmount,
            message: 'Coupon applied successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const addAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { _id, city, state, pin_code, landmark, alternative_no, addresstype } = req.body;

        if (_id) {
            // console.log("id",_id)
            await Address.findByIdAndUpdate(_id, {
                city, state, pin_code, landmark,
                alternative_no, addresstype
            })
            req.flash('success', 'Address updated successfully');
        } else {
            const newAddress = new Address({
                user_id: userId,
                city, state, pin_code,
                landmark, alternative_no, addresstype
            });
            await newAddress.save();
            req.flash('success', 'Address added successfully');
        }
        res.redirect('/checkout');

    } catch (error) {
        console.error('Add address error:', error);
        req.flash('error', 'Failed to save address');
        res.redirect('/checkout');
    }
}

const deleteAddress = async(req,res)=>{
    try {

        await Address.findByIdAndDelete(req.params.id);
        req.flash('success', 'Address deleted successfully');
        res.redirect('/checkout');
        
    } catch (error) {
        console.error('Delete address error:', error);
        req.flash('error', 'Failed to delete address');
        res.redirect('/checkout');
        
    }
}



module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    getCheckoutPage,
    addAddress,
    deleteAddress,
    applyCoupon
};


