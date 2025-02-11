const mongoose = require('mongoose')
const {Schema} = mongoose

const categorySchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true,   
    },
    description:{   
        type:String,
        required:true,
    },
    categoryOffer: {
         type: Number,
          default: 0 
        }, 
    is_deleted:{
        type:Boolean,
        default:false,
    },
    isListed: {
        type : Boolean,
        default : true
    },
    
})

const Category = mongoose.model("Category",categorySchema);
module.exports = Category;
