const express = require("express")
const app =express()
const env =require("dotenv").config();
const db=require("./config/db")
db()


// app.get('/',(req,res)=>{
//     res.send("welcome")
// })

app.listen(process.env.PORT,()=>{
    console.log("server is running")
})


module.exports=app;