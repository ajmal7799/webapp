const express = require("express")
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const {userAuth,adminAuth} = require("../middlewares/auth")
const productController = require("../controllers/user/productController")

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


router.get('/productDetails', productController.productDetails);         // for query params (?id=)

router.get('/productDetails/:id', productController.productDetails);

module.exports = router;