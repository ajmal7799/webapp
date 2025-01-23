const mongoose = require("mongoose")
const { Schema } = mongoose;

const addressSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pin_code: {
        type : String,
        required : true
    },
    landmark: {
        type: String,
        required: true
    },
    
    alternative_no: {
        type: String
    },
    addresstype: {
        type: String,
        enum: ["home", "office", "other"],
        required: true,
    }

}, { timestamps: true })

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;