const express = require("express")
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const {userAuth,adminAuth} = require("../middlewares/auth")
const productController = require("../controllers/user/productController")
const addresController = require("../controllers/user/addressController");
const cartController = require("../controllers/user/cartController")


router.get("/pageNotFound", userController.pageNotFound)
router.get("/", userController.loadHomepage)
router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);


router.get("/auth/google", passport.authenticate("google", { scope: ['profile', 'email'] }))
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
res.redirect('/')
});


router.get("/login", userController.loadLogin);
router.post("/login", userController.login)
router.get("/logout", userController.logout);

// products management
router.get('/productDetails', productController.productDetails);         
router.get('/productDetails/:id', productController.productDetails);


// profile management
router.get("/userProfile",userAuth,userController.uesrProfile);

// account details
router.get("/account",userAuth,userController.accountDetails)

// update profile
router.post("/update-profile",userAuth,userController.editProfile);


// addres management
router.get("/addresses", userAuth,addresController.getAddresses);
router.post("/addresses",userAuth,addresController.addAddress); 
router.post("/addresses/edit",userAuth,addresController.editAddress);
router.delete('/addresses/delete/:id', userAuth, addresController.deleteAddresses);


// forgot password
router.get("/forgot-password",userController.getForgotPassPage)
router.post("/forgot-email-valid",userController.forgotEmailValid)
router.post("/verify-passForgot-otp",userController.verifyForgotPassOtp)
router.get("/reset-password",userController.getRestPassPage)
router.post("/resend-forgot-otp",userController.reOtp)
router.post("/reset-password",userController.postNewPassword);



// change password
router.get("/change-password",userAuth,userController.showChangePassword);
router.post('/change-password',userAuth, userController.changePassword);



// shop page
router.get("/shop",userController.getShopPage)




// Cart Controller
router.get("/cartPage",userAuth,cartController.getCartPage);
router.post("/addToCart", userAuth, cartController.addToCart)
router.post("/remove",userAuth,cartController.removeFromCart) 
router.post("/api/cart/update", userAuth, cartController.updateCartQuantity)




// checkout page 
router.get("/checkout",userAuth,cartController.getCheckoutPage)
router.post('/add-address', userAuth, cartController.addAddress);
router.get('/delete-address/:id',userAuth,cartController.deleteAddress)

module.exports = router;