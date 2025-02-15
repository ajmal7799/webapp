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



const loadDashboard = async (req, res) => {

    
    
    try {
        const orders = await Order.find({
            orderStatus: "delivered",
        });
      
   
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
      const cancelledData = await Order.aggregate([
        { $unwind: "$products" },
        { $match: { "orderStatus": "cancelled" } },
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
  
   
      const salesData = await Order.countDocuments({
        orderStatus: 'delivered',
      });
  
     
      const newUsersCount = await User.countDocuments();
  
      
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
            productName: "$productDetails.name",
            totalOrder: 1,
          },
        },
        { $sort: { totalOrder: -1 } },
        { $limit: 10 }, 
      ]);
     
  
      
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
            _id: "$productDetails.category_id",
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
            categoryName: "$categoryDetails.name",
            totalOrder: 1,
          },
        },
        { $sort: { totalOrder: -1 } },
        { $limit: 10 }, 
      ]);
     
  
      
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
  
     
      const productData = product.map((item) => ({
        productName: item.productName,
        totalOrder: item.totalOrder,
      }));
  
      console.log(productData)

      const categoryData = category.map((cat) => ({
        categoryName: cat.categoryName,
        totalOrder: cat.totalOrder,
      }));
  
      const userData = users.map((user) => ({
        date: user._id,
        count: user.count,
      }));
  console.log(categoryData)
  
      
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



const getFilterData = async (filter = 'default') => {
    let startDate, endDate = new Date();
    
    switch(filter) {
        case 'daily':
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'weekly':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'yearly':
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        default:
            startDate = new Date(0);
    }

    
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: "delivered"
        });
    
       
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const salesData = orders.length;
    
       
        const cancelledCount = await Order.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: 'cancelled'
        });
    
        
        const newUsersCount = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });
    
        
        const productData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.product',
                    totalOrder: { $sum: '$products.quantity' }
                }
            },
            { $sort: { totalOrder: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
      {
  $project: {
    productName: { $arrayElemAt: ['$productInfo.name', 0] },
    totalOrder: 1
  }
}
        ]);
    
       
        const categoryData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $group: {
                    _id: '$productInfo.category_id',
                    totalOrder: { $sum: '$products.quantity' }
                }
            },
            { $sort: { totalOrder: -1 } },
            { $limit: 4 },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $project: {
                  categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] }, 
                  totalOrder: 1
                }
              }
        ]);
    
       
        const userData = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);
    
        return {
            totalRevenue,
            salesData,
            cancelledCount,
            newUsersCount,
            productData,
            categoryData,
            userData
        };
};
  const getDashboardData = async (req, res) => {
    console.log('Fetching dashboard data');
    try {
        const filter = req.query.filter || 'default';
        const data = await getFilterData(filter);

        console.log(data);
        
        res.json({
            totalRevenue: data.totalRevenue,
            salesData: data.salesData,
            cancelledCount: data.cancelledCount,
            newUsersCount: data.newUsersCount,
            productData: data.productData,
            categoryData: data.categoryData,
            userData: data.userData
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
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
    getDashboardData,
}

