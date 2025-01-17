// // const mongoose = require("mongoose")
// // const {Schema} = mongoose;


// // const productSchema = new Schema({
// //     productName :{
// //         type: String,
// //         required: true,
// //     },
// //     description:{
// //         type : String,
// //         required:true,
// //     },
// //     brand: {
// //         type : String,
// //         required:true,
// //     },
// //     category:{
// //         type: Schema.Types.ObjectId,
// //         ref: "Category",
// //         required:true,

// //     },
// //     regularPrice:{
// //         type:Number,
// //         required:true,
// //     },
// //     salesPrice:{
// //         type:Number,
// //         required:true
// //     },
// //     productOffer:{
// //         type:Number,
// //         default:0,

// //     },
// //     quantity:{
// //         type:Number,
// //         default:true
// //     },
// //     color:{
// //         type:String,
// //         required:true,
// //     },
// //     productImage:{
// //         type:[String],
// //         required:true
// //     },
// //     isBlocked:{
// //         type:Boolean, 
// //         default:false
// //     },
// //     status:{
// //         type:String,
// //         enum:["Available","out of stock","Discountinued"],
// //         required:true,
// //         default:"Available"
// //     },
// // },{timestamps:true})

// // const Product = mongoose.model("product",productSchema)
// // module.exports = Product


// // const mongoose = require('mongoose')
// // const { Schema } = mongoose

// // const productSchema = new Schema({
// //     productName: {
// //         type: String,
// //         required: true,
// //     },
// //     category_id: {
// //         type: Schema.Types.ObjectId,
// //         ref: "Category",
// //         required: true,
// //     },
// //     author_name: {
// //         type: String,
// //         required: true,
// //     },
// //     price: {
// //         type: Number,
// //         required: true,
// //     },
// //     available_quantity: {
// //         type: Number,
// //         default: 0,
// //     },
// //     description: {
// //         type: String,
// //         required: true,
// //     },
// //     publishing_date: {
// //         type: Date,
// //         required: false,
// //     },
// //     publisher: {
// //         type: String,
// //         required: true,
// //     },
// //     page: {
// //         type: Number,
// //         required: true,
// //     },
// //     language: {
// //         type: String,
// //         required: true,
// //     },
// //     product_imgs: {
// //         type: [String],
// //         required: true,
// //     },
// //     status: {
// //         type: String,
// //         enum: ["active", "discontinued", "unavailable"],
// //         required: true,
// //         default: "active"
// //     },
// //     is_deleted: {
// //         type: Boolean,
// //         default: false
// //     },
// //     created_at: {
// //         type: Date,
// //         default: Date.now
// //     },
// //     updated_at: {
// //         type: Date,
// //         default: Date.now
// //     }
// // })

// // productSchema.pre('save', function (next) {
// //     this.updated_at = Date.now();
// //     next();
// // });

// // productSchema.virtual("stock_state").get(function() {
// //     if(this.is_deleted) return "Blocked";
// //     if(this.available_quantity === 0) return this.status === "discontinued" ? "Sold out" : "Out of stock";
// //     if(this.status === "unavailable") return "Unavailable"
// //     return "Available"
// // })

// // const Product = mongoose.model('Product', productSchema)

// // module.exports = Product


// const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     Published_Date: {
//         type: Date,
//         required: false,
//     },
//     writer: {
//         type: String,
//         required: false,
//     },
//     cover_Artist: {
//         type: String,
//         required: false,
//     },
//     category_id: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Category',
//         required: true,
//     },
//     genre_id: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Genre',
//         required: false,
//     },
//     language: {
//         type: String,
//         enum: ['English', 'Malayalam', 'Hindi', 'Tamil'],
//         required: false,
//     },
//     offerPrice: {
//         type: Number,
//         default: 0
//     },
//     offerPercentage: {
//         type: Number,
//         default: 0
//     },
//     offerStartDate: {
//         type: Date
//     },
//     offerEndDate: {
//         type: Date
//     },
//     available_quantity: {
//         type: Number,
//         required: false,
//     },
//     Regular_price: {
//         type: Number,
//         required: true,
//     },
//     Sale_price: {
//         type: Number,
//     },
//     description: {
//         type: String,
//         required: true,
//     },
//     quantity: {
//         type: Number,
//         default: 0
//     },
//     product_img: {
//         type: [String],
//         required: true,
//     },
//     isBlocked: {
//         type: Boolean,
//         default: false
//     },
//     status: {
//         type: String,
//         default: 'list',
//     },
// });

// const Product = mongoose.model('Product', productSchema);

// module.exports = Product;
const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    publishedDate: {
        type: Date,
        required: false,
    },
    writer: {
        type: String,
        required: false,
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    language: {
        type: String,
        enum: ['English', 'Malayalam', 'Hindi', 'Tamil'],
        required: false,
    },
    regularPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        required: true,
    },
    availableQuantity: {
        type: Number,
        default: 0,
    },
    productImages: {
        type: [String],
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['Available', 'Out of Stock', 'Discontinued'],
        default: 'Available',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
