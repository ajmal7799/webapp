const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const pageerror = async (req,res)=>{
    res.render("admin-error")
}

const loadLogin = async (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    } else {
        
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


// const loadDashboard = async (req, res) => {
//     try {
//         console.log("Dashboard loaded"); 

//         const revenueData = await Order.aggregate([
//             { $unwind: "$products" },
//             { $match: { "products.orderStatus": "delivered" } },
//             // Group by order _id so that if an order has multiple delivered products,
//             // its totalAmount is counted only once.
//             { $group: { _id: "$_id", orderTotal: { $first: "$totalAmount" } } },
//             { $group: { _id: null, totalRevenue: { $sum: "$orderTotal" } } }
//           ]);
//           const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
//           console.log(totalRevenue);


//           const cancelledData = await Order.aggregate([
//             { $unwind: "$products" },
//             { $match: { "products.orderStatus": "cancelled" } },
//             { $group: { _id: "$_id" } },
//             { $group: { _id: null, totalCancelled: { $sum: 1 } } }
//           ]);
//           const cancelledCount = cancelledData.length > 0 ? cancelledData[0].totalCancelled : 0;

//         const salesData = await Order.countDocuments();

//         const newUsersCount = await User.countDocuments();

//         const product = await Order.aggregate([
//             {$unwind:"$products"},
//             {
//                 $group:{
//                     _id:"$products.product",
//                     totalOrder:{$sum:"$products.quantity"}
//                 },
//             },
//             {
//                 $lookup:{
//                     from:"products",
//                     localField:"_id",
//                     foreignField:"_id",
//                     as:"productDetails"
//                 },
//             },
//             {$unwind:"$productDetails"},
//             {
//                 $project:{
//                     _id:1,
//                     productName:"$productDetails.productName",
//                     totalOrder:1
//                 },
//             },
//             {$sort:{totalOrder:-1}},
//             {$limit:4}
//         ]);

//         const category = await Order.aggregate([
//             {$unwind:"$products"},
//             {
//                 $lookup:{
//                     from:"products",
//                     localField:"products.product",
//                     foreignField:"_id",
//                     as:"productDetails",
//                 },
//             },
//             {$unwind:"$productDetails"},
//             {
//                 $group:{
//                     _id:"$productDetails.category",
//                     totalOrder:{$sum:"$products.quantity"}
//                 },
//             },
//             {
//                 $lookup:{
//                     from:"categories",
//                     localField:"_id",
//                     foreignField:"_id",
//                     as:"categoryDetails"
//                 },
//             },
//             {$unwind:"$categoryDetails"},
//             {
//                 $project:{
//                     _id:1,
//                     categoryName:"$categoryDetails.categoryName",
//                     totalOrder:1
//                 },
//             },
//             {$sort:{totalOrder:-1}},
//             {$limit:4}
//         ]);

       

//         const users = await User.aggregate([
//             {
//                 $group:{
//                     _id:{
//                         $dateToString:{format:"%Y-%m-%d",date:"$createdAt"}
//                     },
//                     count:{$sum:1}
//                 }
//             },
//             {$sort:{_id:-1}},
//             {$limit:4}
//         ]);

//         const productData = product.map((item) => ({
//             productName: item.productName,
//             totalOrder: item.totalOrder,
//         }));

//         const categoryData = category.map((cat) => ({
//             categoryName: cat.categoryName,
//             totalOrder: cat.totalOrder,
//         }));

 
//         const userData = users.map((user) => ({
//             date: user._id,
//             count: user.count,
//         }));

//         console.log(productData);

//         res.render("dashboard", {
//             productData,
//             categoryData,
//             userData,
//             totalRevenue,
//             cancelledCount,
//             salesData,
//             newUsersCount,
//         });

//     } catch (error) {
//         console.error('Error fetching order details:', error);
//         res.status(500).send("Internal server error");
//     }
// };

const loadDashboard = async (req, res) => {
    try {
      // Fetch total revenue
      const revenueData = await Order.aggregate([
        { $unwind: "$products" },
        { $match: { "products.orderStatus": "delivered" } },
        {
          $group: {
            _id: "$_id",
            orderTotal: { $first: "$totalAmount" },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$orderTotal" },
          },
        },
      ]);
      const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
  
      // Fetch cancelled orders count
      const cancelledData = await Order.aggregate([
        { $unwind: "$products" },
        { $match: { "products.orderStatus": "cancelled" } },
        {
          $group: {
            _id: "$_id",
          },
        },
        {
          $group: {
            _id: null,
            totalCancelled: { $sum: 1 },
          },
        },
      ]);
      const cancelledCount = cancelledData.length > 0 ? cancelledData[0].totalCancelled : 0;
  
      // Fetch total sales count
      const salesData = await Order.countDocuments();
  
      // Fetch new users count
      const newUsersCount = await User.countDocuments();
  
      // Fetch top 10 products
      const product = await Order.aggregate([
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product",
            totalOrder: { $sum: "$products.quantity" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            _id: 1,
            productName: "$productDetails.productName",
            totalOrder: 1,
          },
        },
        { $sort: { totalOrder: -1 } },
        { $limit: 10 }, // Fetch top 10 products
      ]);
  
      // Fetch top 10 categories
      const category = await Order.aggregate([
        { $unwind: "$products" },
        {
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$productDetails.category",
            totalOrder: { $sum: "$products.quantity" },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        {
          $project: {
            _id: 1,
            categoryName: "$categoryDetails.categoryName",
            totalOrder: 1,
          },
        },
        { $sort: { totalOrder: -1 } },
        { $limit: 10 }, // Fetch top 10 categories
      ]);
  
      // Fetch new users (last 4 days)
      const users = await User.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 4 },
      ]);
  
      // Format data for the frontend
      const productData = product.map((item) => ({
        productName: item.productName,
        totalOrder: item.totalOrder,
      }));
  
      const categoryData = category.map((cat) => ({
        categoryName: cat.categoryName,
        totalOrder: cat.totalOrder,
      }));
  
      const userData = users.map((user) => ({
        date: user._id,
        count: user.count,
      }));
  
      // Render the dashboard with data
      res.render("dashboard", {
        productData,
        categoryData,
        userData,
        totalRevenue,
        cancelledCount,
        salesData,
        newUsersCount,
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).send("Internal server error");
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

