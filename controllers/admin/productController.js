const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const path = require('path');
const sharp = require("sharp");
const fs = require('fs')



const getAddProductAppPage = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });

        res.render('product-add', { cat: categories });
    } catch (error) {
        console.error('Error loading add product page:', error);
        res.status(500).send('Error loading page');
    }
};


const addProduct = async (req, res) => {
    console.log("Request body: ", req.body);
    try {
        const {
            productName,
            writer,
            publishedDate,
            language,
            description,
            regularPrice,
            salePrice,
            quantity,
            category,
            productImages = [],
        } = req.body;


        for (let i = 1; i <= 3; i++) {
            const uploadedFile = req.files?.[`imageInput${i}`]?.[0];
            const croppedImage = req.body?.[`croppedImage${i}`];

            if (croppedImage) {

                if (!croppedImage.startsWith("data:image/")) {
                    console.error(`Invalid Base64 image data for image ${i}`);
                    continue;
                }

                const base64Data = croppedImage.split(",")[1];
                const imageBuffer = Buffer.from(base64Data, "base64");
                const imagePath = `/uploads/products/${Date.now()}-${i}-cropped.jpg`;

                await sharp(imageBuffer)
                    .jpeg({ quality: 90 })
                    .toFile(`./public${imagePath}`);

                productImages.push(imagePath);
            } else if (uploadedFile?.buffer) {

                const imagePath = `/uploads/products/${Date.now()}-${i}-original.jpg`;

                await sharp(uploadedFile.buffer)
                    .resize(400, 400, { fit: "cover" })
                    .jpeg({ quality: 90 })
                    .toFile(`./public${imagePath}`);

                images.push(imagePath);
            } else {
                console.log(`No valid image input for image ${i}`);
            }
        }


        if (!regularPrice || !category || !productName || !description) {
            console.error("Validation error: Missing required fields");
            return res.redirect("/admin/add-product");
        }


        const product = new Product({
            name: productName,
            writer,
            publishedDate,
            language,
            description,
            regularPrice,
            salePrice: salePrice || regularPrice,
            availableQuantity: quantity || 0,
            category_id: category,
            productImages,
            status: "Available",
        });

        await product.save();
        console.log("completed", product)
        res.redirect("/admin/products");

    } catch (error) {
        console.error("Error adding product:", error);


        res.redirect("/admin/add-product");
    }
}


const getAllProducts = async (req, res) => {
    try {


        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;

        const productData = await Product.find({
            $or: [
                { name: { $regex: new RegExp(".*" + search + ".*", "i") } }
            ]
        })
            // .sort({ _id: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate({
                path: 'category_id',
                select: 'name',
                match: { isListed: true }
            })
            .exec();

        const count = await Product.find({
            name: { $regex: new RegExp(".*" + search + ".*", "i") }
        }).countDocuments();

        const category = await Category.find({ isListed: true });

        res.render("products", {
            data: productData || [],
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            cat: category || []
        });

    } catch (error) {
        console.error("Error in getAllProducts:", error);
        res.redirect("/pageerror");
    }
};

const blockProduct = async (req, res) => {
    try {

        let id = req.query.id;

        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect("/admin/products");

    } catch (error) {

        res.redirect("/pageerror");

    }
}
const unblockProduct = async (req, res) => {
    try {

        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } })
        res.redirect("/admin/products")

    } catch (error) {
        res.redirect("/pageerror")

    }
}





const getEditProduct = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Product.findById(productId);
        const cat = await Category.find({ isListed: true });

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        res.render('edit-product', {
            product,
            categories: cat,
            message: req.flash()
        });
    } catch (error) {
        console.error('Error loading edit product page:', error);

        res.redirect('/admin/products');
    }
}

// Update Product
const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const {
            productName,
            writer,
            publishedDate,
            language,
            description,
            regularPrice,
            salePrice,
            availableQuantity,
            category_id,
        } = req.body;



        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }
        let productImages = [...existingProduct.productImages];


        for (let i = 1; i <= 3; i++) {
            const uploadedFile = req.files[`imageInput${i}`]?.[0];
            const croppedImage = req.body[`croppedImage${i}`];

            if (croppedImage) {

                if (productImages[i - 1]) {
                    const oldPath = `./public${productImages[i - 1]}`;
                    try {
                        await fs.promises.unlink(oldPath);
                    } catch (err) {
                        console.error('Error deleting old image:', err);
                    }
                }


                const base64Data = croppedImage.replace(/^data:image\/jpeg;base64,/, "");
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const imagePath = `/uploads/products/${Date.now()}-${i}-cropped.jpg`;

                await sharp(imageBuffer)
                    .jpeg({ quality: 90 })
                    .toFile(`./public${imagePath}`);

                productImages[i - 1] = imagePath;

            } else if (uploadedFile) {
                if (productImages[i - 1]) {
                    const oldPath = `./uploads/products/${productImages[i - 1].split('/').pop()}`;
                    try {
                        await fs.promises.unlink(oldPath);

                    } catch (err) {
                        console.error('Error deleting old image:', err);
                    }
                }


                const imagePath = `/uploads/products/${Date.now()}-${i}-original.jpg`;

                await sharp(uploadedFile.buffer)
                    .resize(400, 400, { fit: 'cover' })
                    .jpeg({ quality: 90 })
                    .toFile(`./public${imagePath}`);

                productImages[i - 1] = imagePath;
            }
        }


        await Product.findByIdAndUpdate(productId, {
            name: productName,
            writer,
            publishedDate,
            language,
            description,
            regularPrice,
            salePrice,
            availableQuantity,
            category_id,
            productImages,
            updatedAt: new Date()
        }, { new: true });

        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/products');


    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error', 'Error updating product');
        res.redirect(`/admin/editProduct?id=${req.params.id}`);
    }
}








module.exports = {
    getAddProductAppPage,
    addProduct,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    updateProduct,

};