const mongoose = require("mongoose")
const {Schema} = mongoose;

const coupenSchema = new Schema({

    name:{
        type:String,
        required:true,
        
    },
    createon:{
        type:Date,
        default:Date.now,
        required:true
    },
    expireOn:{
        type:Date,
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    minimumPrice:{
       type:Number,
       required:true
    },
    isList:{
        type:Boolean,
        default:true
    },
    UsageLimit:{
        type:Number,
        required:false
    },
    userId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]
})

const Coupen = mongoose.model("Coupen", coupenSchema)

module.exports = Coupen