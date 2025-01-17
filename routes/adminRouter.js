const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController")
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController")
const {userAuth,adminAuth} = require("../middlewares/auth");
const path = require('path');

// const upload = require('../middlewares/multerConfig');
// const Product = require("../models/productSchema");
// const upload = require('../middlewares/multerConfig'); 
const uploadMiddleware = require('../middlewares/multerConfig');
// const uploadMiddleware = require('./path-to-multer-config');
// const upload = require('../middlewares/multerConfig');  // Use a different name



const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/products');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Login Management
router.get("/pageerror",adminController.pageerror)
router.get("/login",adminController.loadLogin)
router.post("/login",adminController.login);
router.get("/dashboard",adminAuth,adminController.loadDashboard)
router.get("/logout",adminController.logout);

// Customer management
router.get("/users",adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth,customerController.customerunBlocked);



// Category Management
router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.get("/editCategory",adminAuth,categoryController.getEditCategory);
router.post("/editCategory/:id",adminAuth,categoryController.editCategory)
router.delete("/deleteCategory/:id",adminAuth,categoryController.deleteCategory);
router.get("/listCategory",adminAuth,categoryController.getListCategory);
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory)


// Product management
// router.get("/addProducts",adminAuth,productController.getProductAddPage)
// router.post("/addProducts",adminAuth,upload.array("images"),productController.addProducts)
// const uploadMiddleware = require('./path-to-multer-config');

// In your route
// router.post('/addProducts', uploadMiddleware('images'), productController.addProducts); 

// router.post("/products", adminAuth, uploadMiddleware.array("images"), productController.addProducts);

// router.post('/addProducts', uploadMiddleware.array('images', 5), addProducts);

// const multer = require('multer');
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

router.get('/addProducts', adminAuth, productController.getAddProductAppPage);



router.post('/add-product', 
    adminAuth, 
    upload.fields([
        { name: 'imageInput1', maxCount: 1 },
        { name: 'imageInput2', maxCount: 1 },
        { name: 'imageInput3', maxCount: 1 }
    ]),
    productController.addProduct
);
// router.get('/add-product', adminController.getAddProduct);


router.get("/products",adminAuth,productController.getAllProducts);
router.get("/blockProduct",adminAuth,productController.blockProduct);
router.get("/unblockProduct",adminAuth,productController.unblockProduct);
router.get("/editProduct",adminAuth,productController.getEditProduct);



router.get('/editProduct', adminAuth, productController.getEditProduct);
router.post('/editProduct/:id', 
    adminAuth,
    upload.fields([
        { name: 'imageInput1', maxCount: 1 },
        { name: 'imageInput2', maxCount: 1 },
        { name: 'imageInput3', maxCount: 1 }
    ]),
    productController.updateProduct
);



module.exports = router;