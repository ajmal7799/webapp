const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController")
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController")
const orderController = require("../controllers/admin/orderController")
const couponController = require("../controllers/admin/couponController")
const salesController = require("../controllers/admin/salesController");
const dashboardController = require("../controllers/admin/dashboardController");
const {userAuth,adminAuth} = require("../middlewares/auth");
const path = require('path');



const uploadMiddleware = require('../middlewares/multerConfig');




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

// order management
router.get('/order',adminAuth,orderController.getOrders)
router.post('/update-order-status', adminAuth, orderController.updateOrderStatus);
router.get('/order-details/:orderId', adminAuth, orderController.orderDetails);
router.get('/orders',adminAuth,orderController.orderDetails)


// coupon management
router.get("/coupon",adminAuth,couponController.loadCouponPage);
router.post("/addCoupon",adminAuth,couponController.addCoupon);
router.get("/editCoupon",adminAuth,couponController.loadEditCoupon);
router.post("/editCoupon",adminAuth,couponController.editCoupon);
router.delete("/deleteCoupon", adminAuth, couponController.deleteCoupon);


// Category offer
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer);
router.post("/removeCategoryOffer",adminAuth,categoryController.removeCategoryOffer);


// Product offer
router.post("/addProductOffer",adminAuth,productController.addProductOffer);
router.post("/removeProductOffer",adminAuth,productController.removeProductOffer)


// sales report
router.get("/salesreport",adminAuth,salesController.loadSalesReport);

router.get('/sales-report/download-sales-pdf', adminAuth,salesController.downloadSalesPDF);
router.post('/sales-report/excel',adminAuth,salesController.downloadExcel)


// router.get('/dashboard',adminAuth,dashboardController.loadDashboard);  
// router.get('/filterData', adminAuth, dashboardController.filterData);


module.exports = router;