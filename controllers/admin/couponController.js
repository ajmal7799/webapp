const Category = require("../../models/categorySchema")
const Coupon = require("../../models/couponSchema");
const Product = require("../../models/productSchema");
const Order = require("../../models/orderSchema");


const loadCouponPage = async (req,res)=>{
    try {
        const coupon = await Coupon.find()
        res.render('coupon',{coupon});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"server error"});
    }
}

const addCoupon = async (req, res) => {
    try {
        const {
            code,
            offerPrice,
            createon,
            expireOn,
            minimumPrice,
            UsageLimit,
            isList
        } = req.body;

    
        

        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('-');
            
            return new Date(year, parseInt(month) - 1, day);
        };

        const createdDate = parseDate(createon);
        const expiryDate = parseDate(expireOn);

        
        if (isNaN(createdDate.getTime()) || isNaN(expiryDate.getTime())) {
            console.log('Invalid date detected:', { createon, expireOn });
            return res.status(400).json({
                status: false,
                message: 'Invalid date format'
            });
        }

        
        // console.log('Parsed dates:', {
        //     createdDate,
        //     expiryDate
        // });

        const coupon = new Coupon({
            name: code,
            offerPrice: offerPrice,
            createon: createdDate,
            expireOn: expiryDate,
            minimumPrice: minimumPrice,
            UsageLimit: UsageLimit,
            isList: isList
        });

        await coupon.save();
        
        res.status(200).json({ 
            status: true, 
            message: 'Coupon added successfully' 
        });

    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ 
            status: false, 
            message: error.message || 'Failed to add coupon' 
        });
    }
};

const loadEditCoupon = async(req,res)=>{
    try {
        const couponId = req.query.id;

        const coupon = await Coupon.findById({_id:couponId})
        res.render("editcoupon",{coupon:coupon})
        
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"server error"})
        
    }
}

const editCoupon  = async(req,res)=>{
    try {

        const couponId = req.query.id;
        // console.log(couponId)
        const {code,offerPrice,createon,expireOn,minimumPrice,UsageLimit,isList} = req.body;
        const coupon = await Coupon.findById({_id:couponId})
        coupon.name = code
        coupon.offerPrice  = offerPrice
        coupon.createon = createon
        coupon.expireOn = expireOn
        coupon.minimumPrice = minimumPrice
        coupon.UsageLimit = UsageLimit
        coupon.isList = isList

        await coupon.save()
        res.redirect("/admin/coupon");
        
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"server error"})
    }
}

const deleteCoupon = async(req,res)=>{
    try {
        const couponId = req.query.id;
        const coupon = await Coupon.findByIdAndDelete({_id:couponId});
        res.redirect("/admin/coupon")
        
    } catch (error) {
        console.error(error)
        res.status(500).json({message:"server error"})
        
    }
}



module.exports ={
    loadCouponPage,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon


}
