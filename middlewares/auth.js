const User =require("../models/userSchema")


const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next()
            }else{
                res.redirect("/login"); 
            }
        })
        .catch(error=>{
            console.log("error in user auth middleware",error);
            res.status(500).send("Internal server error")
        })
    }else{
        res.redirect("/login")
    }
}


const adminAuth = (req,res,next)=>{
    if(req.session.admin){
        User.findOne({isAdmin:true})
        .then(data=>{
            if(data){
                next()
            }else{
                res.redirect("/admin/login"); 
            }
        })
        .catch(error=>{
            console.log("error in user auth middleware",error);
            res.status(500).send("Internal server error")
        })
    }else{
        res.redirect("/admin/login")
    }
}

module.exports = {
    userAuth,
    adminAuth,
}


// const isAuthenticated = (req, res, next) => {
//     try {
//         if (req.session && req.session.user) {
//             next();
//         } else {
//             res.redirect("/login");
//         }
//     } catch (error) {
//         console.error("Authentication error:", error);
//         res.status(500).redirect("/login");
//     }
// };

// const isLogin = (req, res, next) => {
//     try {
//         if (req.session && req.session.user) {
//             res.redirect("/");
//         } else {
//             next();
//         }
//     } catch (error) {
//         console.error("Login check error:", error);
//         res.status(500).redirect("/login");
//     }
// };

// module.exports = {
//     isAuthenticated,
//     isLogin
// };