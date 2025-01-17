const mongoose = require("mongoose")
const env = require("dotenv").config();



const connectDB = async()=>{
    try {
        
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("DB Connected")

    } catch (error) {

        console.log("DB Connection error",error.message)
        process.exit(1);

    }
}

module.exports= connectDB

// const mongoose = require("mongoose")
// const connectDB = async()=>{
//     try {
//         const connect = await mongoose.connect("mongodh://localhost:27017/WEBAPP")
//         console.log("connect database")
//     } catch (error) {
//         console.log("error")
//     }
// }
// module.exports=connectDB

