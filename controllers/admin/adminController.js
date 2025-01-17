const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const pageerror = async (req,res)=>{
    res.render("admin-error")
}

const loadLogin = async (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    } else {
        // console.log('Rendering admin login page');
        res.render("admin-login", { message: null });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin: true });
        // console.log(admin);
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                req.session.admin = true;
                // console.log("session admin set", req.session.admin)
                return res.redirect("/admin/dashboard");
            } else {
                res.render("admin-login",{message:"Invalid password"});
            }
        } else {
            res.render("admin-login");

        }
    } catch (error) {
        console.log("login error ", error);
        res.redirect("/pageerror");

    }
}


const loadDashboard = async (req, res) => {
    try {
        if (req.session.admin){
            res.render("dashboard");
        }else{
            return res.redirect("/admin/login");
        }
    } catch (error) {
        console.error("Error loading dashboard:", error);
        res.redirect("/pageerror");
    }
    
};


const logout = async(req,res)=>{
    try {
        req.session.destroy(err =>{
            if(err){
                console.log("error destroying session",err);
                return res.redirect("/pageerror");
            }else{
                res.redirect("/admin/login")
            }
        })
    } catch (error) {
        console.log("unexpected error during logout",error);
        res.redirect("/pageerror")
        
    }    
 
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,
}