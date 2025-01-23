const mongoose = require('mongoose')
const {Schema} = mongoose;


const cartSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    books:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        availableQuantity:{
          type:Number,
          required:true
        }

    }],
    createdAt:{
        type:Date,
        default:Date.now
    }
})
module.exports = mongoose.model("Cart",cartSchema);