const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const path = require('path');
const sharp = require("sharp");
const fs = require('fs')

// const getProductAddPage = async (req,res)=>{
//     try {
//         const category = await Category.find({isListed:true});
//         res.render("product-add",{cat:category,})

//     } catch (error) { 
//         res.redirect("/pageerror"); 

//     }
// };


// const ensureUploadDirectoryExists = async () => {
//     const uploadDir = path.join('public', 'uploads', 'product-images');
//     try {
//         await fs.access(uploadDir);
//     } catch (error) {
//         if (error.code === 'ENOENT') {
//             await fs.mkdir(uploadDir, { recursive: true });
//         } else {
//             throw error;
//         }
//     }
// };

// ensureUploadDirectoryExists().catch(console.error);


// const addProducts = async (req, res) => {
//     try {
//         const {
//             productName,
//             writer,
//             publishedDate,
//             description,
//             regularPrice,
//             salePrice,
//             quantity,
//             category,
//             language,
//             croppedImageData1,
//             croppedImageData2,
//             croppedImageData3
//         } = req.body;

//         // Validate incoming data
//         if (!productName || !description || !regularPrice) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing required fields"
//             });
//         }

//         // Process cropped images
//         const images = [croppedImageData1, croppedImageData2, croppedImageData3].filter(Boolean);
//         if (images.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "At least one image is required"
//             });
//         }

//         // Save images to your desired location
//         const savedImagePaths = await Promise.all(images.map(async (imageData) => {
//             // Convert base64 to buffer and save
//             const buffer = Buffer.from(imageData.split(',')[1], 'base64');
//             const filename = `product_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
//             const path = `public/uploads/product-images/${filename}`;
//             await fs.writeFile(path, buffer);
//             return filename;
//         }));

//         // Create new product
//         const newProduct = new Product({
//             name: productName,
//             writer,
//             publishedDate,
//             description,
//             Regular_price: parseFloat(regularPrice),
//             Sale_price: salePrice ? parseFloat(salePrice) : undefined,
//             quantity: parseInt(quantity),
//             category,
//             language,
//             product_img: savedImagePaths
//         });

//         await newProduct.save();

//         res.status(201).json({
//             success: true,
//             message: "Product added successfully",
//             product: newProduct
//         });

//     } catch (error) {
//         console.error('Error in addProducts:', error);
//         res.status(500).json({
//             success: false,
//             message: "Error adding product",
//             error: error.message
//         });
//     }
// };



// // Handle product addition
// addProduct: async (req, res) => {
//     try {
//         const {
//             productName,
//             writer,
//             publishedDate,
//             language,
//             description,
//             regularPrice,
//             salePrice,
//             quantity,
//             category
//         } = req.body;

//         const images = [];

//         // Handle both uploaded files and cropped images
//         for (let i = 1; i <= 3; i++) {
//             const uploadedFile = req.files[`imageInput${i}`]?.[0];
//             const croppedImage = req.body[`croppedImage${i}`];

//             if (croppedImage) {
//                 // Handle cropped base64 image
//                 const base64Data = croppedImage.replace(/^data:image\/jpeg;base64,/, "");
//                 const imageBuffer = Buffer.from(base64Data, 'base64');
//                 const imagePath = `/uploads/products/${Date.now()}-${i}-cropped.jpg`;

//                 await sharp(imageBuffer)
//                     .jpeg({ quality: 90 })
//                     .toFile(`./public${imagePath}`);

//                 images.push(imagePath);

//             } else if (uploadedFile) {
//                 // Handle regular file upload
//                 const imagePath = `/uploads/products/${Date.now()}-${i}-original.jpg`;

//                 await sharp(uploadedFile.buffer)
//                     .resize(400, 400, { fit: 'cover' })
//                     .jpeg({ quality: 90 })
//                     .toFile(`./public${imagePath}`);

//                 images.push(imagePath);
//             }
//         }

//         // Create new product
//         const product = new Product({
//             name: productName,
//             writer,
//             publishedDate,
//             language,
//             description,
//             pricing: {
//                 regular: regularPrice,
//                 sale: salePrice || regularPrice
//             },
//             quantity,
//             category,
//             images,
//             createdAt: new Date(),
//             isActive: true
//         });

//         await product.save();

//         req.flash('success', 'Product added successfully');
//         res.redirect('/admin/products');

//     } catch (error) {
//         console.error('Error adding product:', error);
//         req.flash('error', 'Error adding product');
//         res.redirect('/admin/add-product');
//     }
// }

// const uploadDir = path.join(__dirname, '../public/uploads/products');


const getAddProductAppPage = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });

        res.render('product-add', { cat: categories });
    } catch (error) {
        console.error('Error loading add product page:', error);
        res.status(500).send('Error loading page');
    }
};

// Handle product addition
// addProduct: async (req, res) => {
//     console.log("This is body: ",req.body)
//     try {
//         const {
//             productName,
//             writer,
//             publishedDate,
//             language,
//             description,
//             regularPrice,
//             salePrice,
//             quantity,
//             category
//         } = req.body;

//         const images = [];

//         // Handle both uploaded files and cropped images
//         for (let i = 1; i <= 3; i++) {
//             const uploadedFile = req.files[`imageInput${i}`]?.[0];
//             const croppedImage = req.body[`croppedImage${i}`];

//             if (croppedImage) {
//                 // Handle cropped base64 image
//                 const base64Data = croppedImage.replace(/^data:image\/jpeg;base64,/, "");
//                 const imageBuffer = Buffer.from(base64Data, 'base64');
//                 const imagePath = `/uploads/products/${Date.now()}-${i}-cropped.jpg`;

//                 await sharp(imageBuffer)
//                     .jpeg({ quality: 90 })
//                     .toFile(`./public${imagePath}`);

//                 images.push(imagePath);

//             } else if (uploadedFile) {
//                 // Handle regular file upload
//                 const imagePath = `/uploads/products/${Date.now()}-${i}-original.jpg`;

//                 await sharp(uploadedFile.buffer)
//                     .resize(400, 400, { fit: 'cover' })
//                     .jpeg({ quality: 90 })
//                     .toFile(`./public${imagePath}`);

//                 images.push(imagePath);
//             }
//         }

//         // Create new product
//         const product = new Product({
//             name: productName,
//             writer,
//             publishedDate,
//             language,
//             description,
//             pricing: {
//                 regular: regularPrice,
//                 sale: salePrice || regularPrice
//             },
//             quantity,
//             category,
//             images,
//             createdAt: new Date(),
//             isActive: true
//         });

//         await product.save();

//         req.flash('success', 'Product added successfully');
//         res.redirect('/admin/products');

//     } catch (error) {
//         console.error('Error adding product:', error);
//         req.flash('error', 'Error adding product');
//         res.redirect('/admin/add-product');
//     }
// }

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



        // const uploadDir = path.join(__dirname, '../public/uploads');


        // if (!fs.existsSync(uploadDir)) {
        //     fs.mkdirSync(uploadDir, { recursive: true });
        // }
        // const images = [];
        // for (const file of req.files) {
        //     const originalImagePath = file.path; 
        //     const resizedImagePath = path.join(`uploadDir, ${Date.now()}-${file.originalname}`); 
        //     try {
        //         // Resize and save the image
        //         await sharp(originalImagePath).resize({ width: 400, height: 400 }).toFile(resizedImagePath);
        //         images.push(path.basename(resizedImagePath));
        //         console.log(images)
        //     } catch (error) {
        //         console.error('Error processing image:', error.message);
        //         throw error;
        //     }
        // }










        for (let i = 1; i <= 3; i++) {
            const uploadedFile = req.files?.[`imageInput${i}`]?.[0];
            const croppedImage = req.body?.[`croppedImage${i}`];

            if (croppedImage) {
                // Handle cropped Base64 image
                if (!croppedImage.startsWith("data:image/")) {
                    console.error(`Invalid Base64 image data for image ${i}`);
                    continue; // Skip invalid images
                }

                const base64Data = croppedImage.split(",")[1];
                const imageBuffer = Buffer.from(base64Data, "base64");
                const imagePath = `/uploads/products/${Date.now()}-${i}-cropped.jpg`;

                await sharp(imageBuffer)
                    .jpeg({ quality: 90 })
                    .toFile(`./public${imagePath}`);

                productImages.push(imagePath);
            } else if (uploadedFile?.buffer) {
                // Handle uploaded file
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

        // Validate required fields
        if (!regularPrice || !category || !productName || !description) {
            console.error("Validation error: Missing required fields");
            // req.flash("error", "Product name, description, regular price, and category are required.");
            return res.redirect("/admin/add-product");
        }

        // Create the new product
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
            status: "Available", // Default product status
        });

        await product.save();
        console.log("completed", product)
        res.redirect("/admin/products");

    } catch (error) {
        console.error("Error adding product:", error);

        // Handle errors gracefully
        // req.flash("error", "Error adding product. Please try again.");
        res.redirect("/admin/add-product");
    }
}


const getAllProducts = async (req, res) => {
    try {


        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;

        // Updated to use category_id instead of category
        const productData = await Product.find({
            $or: [
                { name: { $regex: new RegExp(".*" + search + ".*", "i") } }
            ]
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate({
                path: 'category_id',  // Changed from category to category_id
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


// const getEditProduct = async(req,res)=>{
//     try {

//         const id = req.query.id;
//         const product = await Product.findOne({_id:id});
//         const category = await Category.find({});

//     } catch (error) {

//     }
// }



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


        // Handle images
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }
        let productImages = [...existingProduct.productImages]; // Keep existing images

        // Process new or cropped images
        for (let i = 1; i <= 3; i++) {
            const uploadedFile = req.files[`imageInput${i}`]?.[0];
            const croppedImage = req.body[`croppedImage${i}`];

            if (croppedImage) {
                // Remove old image if it exists
                if (productImages[i - 1]) {
                    const oldPath = `./public${productImages[i - 1]}`;
                    try {
                        await fs.promises.unlink(oldPath);
                    } catch (err) {
                        console.error('Error deleting old image:', err);
                    }
                }

                // Save new cropped image
                const base64Data = croppedImage.replace(/^data:image\/jpeg;base64,/, "");
                const imageBuffer = Buffer.from(base64Data, 'base64');
                const imagePath = `/uploads/products/${Date.now()}-${i}-cropped.jpg`;

                await sharp(imageBuffer)
                    .jpeg({ quality: 90 })
                    .toFile(`./public${imagePath}`);

                productImages[i - 1] = imagePath;

            } else if (uploadedFile) {
                // Remove old image if it exists
                if (productImages[i - 1]) {
                    const oldPath = `./uploads/products/${productImages[i - 1].split('/').pop()}`;
                    try {
                        await fs.promises.unlink(oldPath);

                    } catch (err) {
                        console.error('Error deleting old image:', err);
                    }
                }

                // Save new uploaded image
                const imagePath = `/uploads/products/${Date.now()}-${i}-original.jpg`;

                await sharp(uploadedFile.buffer)
                    .resize(400, 400, { fit: 'cover' })
                    .jpeg({ quality: 90 })
                    .toFile(`./public${imagePath}`);

                productImages[i - 1] = imagePath;
            }
        }

        // Update product
        await Product.findByIdAndUpdate(productId, {
            name: productName,
            writer,
            publishedDate,
            language,
            description,
            // pricing: {
            //     regular: regularPrice,
            //     sale: salePrice || regularPrice
            // },
            regularPrice,
            salePrice,
            availableQuantity,
            category_id,
            productImages,
            updatedAt: new Date()
        }, { new: true });

        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/products');
        // res.render('edit-product');

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