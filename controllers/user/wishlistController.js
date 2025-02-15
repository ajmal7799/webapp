const Wishlist = require("../../models/wishlistSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const { default: mongoose } = require("mongoose");


const getWishlistPage = async(req,res)=>{
    try {

        if(!req.session || !req.session.user){
            return res.render('login',{
                message: 'Please login to access your wishlist',
            });
        }


        let userId= req.session.user
        const wishlist = await Wishlist.findOne({userId}).populate("books.product") || { books: [] };
        const userData = await User.findOne({_id:userId});

        if (!userData) {
            req.session.destroy();
            return res.render('login', {
                message: 'Please login to continue'
            });
        }

        res.render("wishlist",{wishlist,user:userData});

        
    } catch (error) {
        console.error(error);
        res.status(500).send("error fetching wishlist");
        
    }
}

const addToWishlist = async(req,res)=>{
    try {
        const {id} = req.body
        const userId = req.user._id;

        // console.log("Request Body:", req.body);
        if(!userId){
            return res.json({success:false,message:"please login"})
        }

        const product = await Product.findById(id);
        // console.log(product,"hello")
        if(!product){
            return res.status(404).json({
                success:false,
                message:"product not found",
            });
        }
        let wishlist = await Wishlist.findOne({userId});
        // console.log(wishlist,"wish") 

        if(!wishlist){
            wishlist = new Wishlist({ userId, books: [] });
        }

        const existingItem = wishlist.books.find(
            book =>book.product.toString() === id
        );
        if(existingItem){
            return res.status(400).json({message:"product already in wishlist"})
        }

        wishlist.books.push({product: id })
        await wishlist.save();

        res.json({message:"Item added to wishlist"})
                
        
    } catch (error) {
        console.error("Error adding to wishlist",error)
        res.status(500).json({message:"error adding to wishlist"})
        
    }
}

const removeFromWishlist = async(req,res)=>{
   try {

    const productId = req.params.productId;
    const userId = req.user._id;
    
    const wishlist = await Wishlist.findOne({userId})

    if(!wishlist){
        return res.status(404).json({
            success:false,
            message:"wishlist not found"
        });
    }

    const result = await Wishlist.updateOne(
        {userId},
        {$pull:{books:{product: new mongoose.Types.ObjectId(productId)}}}
    );

    if(result.modifiedCount === 0){
        return res.status(404).json({
            success:false,
            message:"Product not found"
        });
    }
    res.json({success:true,message:"Product removed from cart"})

   } catch (error) {
    console.error("Error removing from wishlist:",error);
    res.status(500).json({success:false,message:"Error removing from wishlist"})
   }
}


module.exports = {
    getWishlistPage,
    addToWishlist,
    removeFromWishlist,

}
