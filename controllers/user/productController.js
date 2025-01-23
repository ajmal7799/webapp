const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");


const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;

        const productId = req.params.id || req.query.id;


        if (!productId) {
            return res.redirect('/pageNotFound');
        }


        const [userData, product] = await Promise.all([
            userId ? User.findById(userId) : null,
            Product.findById(productId).populate('category_id')
        ]);
        const findCategory = product.category_id

        const relatedProducts = await Product.find({ category_id: findCategory._id, _id: { $ne: productId } }).limit(3)

        if (!product) {
            return res.redirect('/pageNotFound');
        }

        if (product.isBlocked) {
            return res.redirect('/');
        }

        res.render('product-details', {
            user: userData,
            product: product,
            category: findCategory,
            relatedProducts: relatedProducts,
            title: product.name,
            productImages: product.images || []

        });

    } catch (error) {
        console.error("Error in product details:", error);
        res.redirect('/pageNotFound');
    }
};


module.exports = {
    productDetails,
}