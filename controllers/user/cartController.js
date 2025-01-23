const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose');

const getCartPage = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate("books.product");
        res.render("cart", { cart });
    } catch (error) {
        console.error(error);
        res.status(500).send("error fetching cart");
    }
};

const addToCart = async (req, res) => {
    try {
        const { id } = req.body; // Product ID
        const userId = req.user._id;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
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
                    availableQuantity: 1
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

module.exports = {
    getCartPage,
    addToCart,
    removeFromCart,
    updateCartQuantity,
};


