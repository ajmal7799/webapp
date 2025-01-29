// const { render } = require("../..");
const User = require("../../models/userSchema")
const Category = require("../../models/productSchema")
const Product = require("../../models/productSchema")
const nodemailer = require("nodemailer")
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const { text } = require("express");
// const { render } = require("ejs");
const mongoose = require('mongoose');


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

        const categories = await Category.find({ isBlocked: false });
        let productData = await Product.aggregate([
            { $match: { isBlocked: false } },
            {
                $lookup: {
                    from: "categories",
                    localField: "category_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" }
        ]);

        // console.log("Found products:", productData);


        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
        productData = productData.slice(0, 4);


        if (!req.session.user) {
            return res.render("home", {
                user: null,
                products: productData,
                categories: categories
            });
        }


        const userData = await User.findOne({ _id: req.session.user._id });


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
        console.log("userrr", req.session.userData)

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
            // res.redirect('/login')

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
            res.status(200).json({ success: true, message: "OTP Resend Secceessfully" })
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



        if (!findUser) return res.render("login", { message: "User not found" });
        if (findUser.isBlocked) return res.render("login", { message: "User is blocked" });

        const passwordMatch = await bcrypt.compare(password, findUser.password);
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


const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("session destruction error", err.message);
                return res.redirect("/pageNotFound");
            } else {
                return res.redirect("/login")
            }

        })
    } catch (error) {
        console.log("logout error", error)
        res.redirect("/pageNotFound")

    }
};


const uesrProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId)
        res.render("profile", {
            user: userData,
        })

    } catch (error) {

        console.error("Error for retrive profile data", error)
        res.redirect("pageNotFound")

    }
}

const accountDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("account-details", {
            user: userData,
        })
    } catch (error) {
        console.error("Error for account details", error);

    }
}


const editProfile = async (req, res) => {
    try {
        const { firstname, lastname, email, phone } = req.body;
        const userId = req.session.user;
        const updatedUser = await User.findByIdAndUpdate(userId,
            { firstname, lastname, email, phone }, { new: true, runValidators: true }
        );

        if (updatedUser) {
            res.redirect("/account")
            // res.status(200).json({ message: "Account updated successfully", user: updatedUser })
        } else {

            res.status(404).json({ error: "User not found" });
        }


    } catch (error) {
        res.status(500).json({ error: "failed to update account" })

    }
}

const showForgotPasswordForm = (req, res) => {

    res.render("forgot-password", { title: "forgot password" })

}


function generateOtp() {
    const digits = "1234567890";
    let otp = ""
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)]
    }
    return otp
}

// const sendVerificationEmail = async (email,otp)=>{
//     try {
//         const transporter = nodemailer.createTransport({
//             service:"gmail",
//             port:587,
//             secure:false,
//             requireTLS:true,
//             auth:{
//                 user:process.env.NODEMAILER_EMAIL,
//                 pass:process.env.NODEMAILER_PASSWORD,
//             }
//         })

//         const mailOptions = {
//             from:process.env.NODEMAILER_EMAIL,
//             to:email,
//             subject:"Your OTP for password reset",
//             text:`your OTP is ${otp}`,
//             html: `<b>Your OTP: ${otp}</b>`,
//         }
//         const info = await transporter.sendMail(mailOptions);
//         console.log("Email send:",info.messageId )
//         return true;

//     } catch (error) {
//         console.error("Error sending email",error)
//         return false;

//     }
// }


const getForgotPassPage = async (req, res) => {
    try {
        res.render("forgot-password")
    } catch (error) {
        res.redirect("/pageNotFound")

    }
}



const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });
        if (findUser) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = email;
                res.render("forgotPass-otp")
                console.log("OTP:", otp);
            } else {
                res.json({ success: false, message: "Failed to send OTP. Please try again" });
            }

        } else {
            res.render("forgot-password", {
                message: "User with this email does not exist"
            });
        }
    } catch (error) {
        res.redirect("/pageNotFound");

    }
}

const verifyForgotPassOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp;
        if (enteredOtp == req.session.userOtp) {
            res.json({ success: true, redirectUrl: "/reset-password" })
        } else {
            res.json({ success: false, message: "OTP not matching" })
        }


    } catch (error) {
        res.status(500).json({ success: false, message: "An error occured. please try again" })

    }
}

const getRestPassPage = async (req, res) => {
    try {
        res.render("reset-password");

    } catch (error) {
        res.redirect("/pageNotFound");
    }
}

const reOtp = async (req, res) => {
    try {
        const otp = generateOtp();
        req.session.userOtp = otp;
        const email = req.session.email;
        console.log("Resending OTP email:", email);
        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP:", otp)
            res.status(200).json({ success: true, message: "Resend OTP Successful" })
        }
    } catch (error) {
        console.error("Error in resend Otp", error);
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const postNewPassword = async (req, res) => {
    try {
        const { newPass1, newPass2 } = req.body;
        const email = req.session.email;
        if (newPass1 == newPass2) {
            const passwordHash = await securePassword(newPass1);
            await User.updateOne(
                { email: email },
                { $set: { password: passwordHash } }
            )
            res.redirect("/login")
        } else {
            res.render("reset-password", { message: "Password do not match" })
        }

    } catch (error) {
        res.redirect('/pageNotFound');

    }
}


const showChangePassword = async (req, res) => {
    try {
        res.render("change-password")

    } catch (error) {

    }
}
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.render('change-password', {
                error: 'All fields are required'
            });
        }


        if (newPassword.length < 8) {
            return res.render('change-password', {
                error: 'Password must be at least 8 characters long'
            });
        }

        if (!/[a-zA-Z]/.test(newPassword)) {
            return res.render('change-password', {
                error: 'Password must contain at least one letter'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('change-password', {
                error: 'New passwords do not match'
            });
        }

        const user = await User.findById(userId)
        if (!user) {
            return res.render("change-password", {
                error: "User not found"
            })
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.render('change-password', {
                error: 'Current password is incorrect'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.render('change-password', {
            success: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.render('change-password', {
            error: 'An error occurred while changing password'
        });

    }
}

const  getShopPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;
        
        const searchQuery = req.query.search ? req.query.search.trim() : '';
        const sortOption = req.query.sort || 'newest';
        
        // Get selected category from query
        const selectedCategory = req.query.category || '';

        // Build match conditions
        let matchConditions = { isBlocked: false };

        // Add search conditions if search query exists
        if (searchQuery) {
            matchConditions.name = { $regex: searchQuery, $options: 'i' };
        }

        // Add category filter if category is selected
        if (selectedCategory) {
            matchConditions.category_id = selectedCategory;
        }

        let sortStage = { $sort: { createdOn: -1 } };
        switch (sortOption) {
            case 'price-low':
                sortStage = { $sort: { regularPrice: 1 }};
                break;
            case 'price-high':
                sortStage = { $sort: { regularPrice: -1 }};
                break;
            case 'name-asc':
                sortStage = { $sort: { name: 1 } };
                break;
            case 'name-desc':
                sortStage = { $sort: { name: -1 } };
                break;
            case 'featured':
                sortStage = { 
                    $sort: { 
                        isFeatured: -1,
                        createdOn: -1 
                    } 
                };
                break;
        }

        // Get all active categories
        const categories = await Category.find({ isBlocked: false });

        const productPipeline = [
            { $match: matchConditions },
            {
                $lookup: {
                    from: "categories",
                    localField: "category_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            sortStage,
            { $skip: skip },
            { $limit: limit }
        ];

        const [productData, totalProductsCount] = await Promise.all([
            Product.aggregate(productPipeline),
            Product.countDocuments(matchConditions)
        ]);

        const totalPages = Math.ceil(totalProductsCount / limit);

        let userData = null;
        if (req.session.user) {
            userData = await User.findOne({ _id: req.session.user._id });
        }

        return res.render("shop", {
            user: userData,
            products: productData,
            categories: categories,
            selectedCategory: selectedCategory,
            currentPage: page,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            searchQuery: searchQuery,
            sort: sortOption
        });

    } catch (error) {
        console.error("Error loading shop page:", error);
        return res.render("shop", {
            user: null,
            products: [],
            categories: [],
            selectedCategory: '',
            currentPage: 1,
            totalPages: 0,
            searchQuery: '',
            sort: 'newest',
            error: "Error loading shop page"
        });
    }
};

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
    uesrProfile,
    accountDetails,
    editProfile,
    showForgotPasswordForm,
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getRestPassPage,
    reOtp,
    postNewPassword,
    showChangePassword,
    changePassword,
    getShopPage,
    
} 