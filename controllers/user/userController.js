// const { render } = require("../..");
const User = require("../../models/userSchema")
const Category = require("../../models/productSchema")
const Product = require("../../models/productSchema")
const nodemailer = require("nodemailer")
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
// const { render } = require("ejs");


const pageNotFound = (req, res) => { 
    try {
        res.render("pageNotFound");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Something went wrong!");
    }
};


const loadHomepage = async (req, res) => {
    try {
        // Fetch categories and products
        const categories = await Category.find({ isBlocked: false });
        let productData = await Product.aggregate([
            {$match:{isBlocked:false}},
            {$lookup:{
                from:"categories",
                localField:"category_id",
                foreignField:"_id",
                as:"category"
            }},
            {$unwind:"$category"}
        ]);

        console.log("Found products:", productData);
        
        // Sort and limit products
        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
        productData = productData.slice(0, 4);

        // Handle user session
        if (!req.session.user) {
            return res.render("home", { 
                user: null,
                products: productData,
                categories: categories 
            });
        }
        console.log(productData);
        
        const userData = await User.findOne({ _id: req.session.user._id });
        console.log("User data found:", userData);

        if (!userData) {
            return res.render("home", { 
                user: null,
                products: productData,
                categories: categories 
            });
        }

        return res.render("home", { 
            user: userData, 
            products: productData,
            categories: categories 
        });

    } catch (error) {
        console.error("Error loading homepage:", error);
        return res.render("home", { 
            user: null,
            products: [],
            categories: [],
            error: "Error loading homepage"
        });
    }
};

const loadSignup = async (req, res) => {
    try {
        res.render("signup")
    } catch (error) {
        console.log("home page not loading", error)
        res.status(500).send("server error");
    }
}


function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },

        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account ",
            text: `your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`,

        })
        return info.accepted.length > 0

    } catch (error) {
        console.error("Error sending email", error)
        console.error("full Error:", error)
        return false
    }
}


const signup = async (req, res) => {
    try {
        const { firstname, lastname, phone, email, password, cpassword } = req.body;

        if (password !== cpassword) {
            return res.render("signup", { message: "passwords do not match" });
        }
        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("signup", { message: "User  this email already exist" })
        }
        const otp = generateOtp();
        console.log("OTP Generated: ", otp)

        const emailSent = await sendVerificationEmail(email, otp)

        if (!emailSent) {
            return res.json("email-error")
        }

        req.session.userOtp = otp;
        req.session.userData = { firstname, lastname, phone, email, password };

        res.render("verify-otp");
        console.log("OTP Sent ", otp)

    } catch (error) {

        console.error("sign error ", error)
        res.redirect("/pageNotFound")

    }
}


const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10)

        return passwordHash;

    } catch (error) {

    }
}


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body
        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.phone,
                password: passwordHash,

            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({ success: true, redirectUrl: "/login" })

        } else {
            res.status(400).json({ success: false, message: "Invalid OTP Please try again" })

        }
    } catch (error) {

        console.error("error verifying OTP", error)
        res.status(500).json({ success: false, message: "An error occured" })


    }
}


const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" })
        }
        const otp = generateOtp();
        req.session.userOtp = otp;
        // console.log("generated",otp)

        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP:", otp)
            res.status(200).json({ success: true, message: "OTP Resend Secceessfully"})
        } else {
            res.status(500).json({ success: false, message: "failed to Resend OTP. Please try again" });

        }


    } catch (error) {
        console.log("Error resending OTP", error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

const loadLogin = async (req, res) => {
    try {
        if (!req.session.user) {
            res.render('login')

        } else {
            res.redirect("/")
        }

    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Debugging: Log the email and password
        // console.log('Received email:', email);
        // console.log('Received password:', password);

        if (!email || !password) {
            return res.render("login", { message: "Email and password are required" });
        }

        const sanitizedEmail = email.trim().toLowerCase();

        const findUser = await User.findOne({
            isAdmin: false,
            email: sanitizedEmail,
        });

        // console.log("user:", findUser)

        if (!findUser) return res.render("login", { message: "User not found" });
        if (findUser.isBlocked) return res.render("login", { message: "User is blocked" });

        const passwordMatch = await  bcrypt.compare(password, findUser.password);
        console.log("pass:", passwordMatch)
        if (!passwordMatch) return res.render("login", { message: "Incorrect Password" });

        req.session.regenerate((err) => {
            if (err) {
                console.error("Session regeneration error:", err);
                return res.render("login", { message: "Login failed" });
            }

            req.login(findUser, (err) => {
                if (err) {
                    console.error("Login error:", err);
                    return res.render("login", { message: "Login failed" });
                }
                req.session.user = {
                    _id: findUser._id,
                    firstname: findUser.firstname,
                    email: findUser.email,

                };

                req.session.save((err) => {
                    if (err) {
                        console.error("Session save error:", err);
                        return res.render("login", { message: "Login failed" });
                    }
                    console.log("Login successful, redirecting to homepage");
                    return res.redirect("/");
                });

            });
        });
    } catch (error) {
        console.error("Login error:", error);
        res.render('login', { message: "Login failed" });
    }
};


const logout = async (req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("session destruction error",err.message);
                return res.redirect("/pageNotFound");
            }else{
                return res.redirect("/login")
            }

        })
    } catch (error) {
        console.log("logout error", error)
        res.redirect("/pageNotFound")   
        
    }  
};


const loadShoppingPage = async (req,res)=>{
    try {
        res.render("shop")
    } catch (error) {
        res.redirect("/pageNotFound")
        
    }
}
 


module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    loadShoppingPage

} 