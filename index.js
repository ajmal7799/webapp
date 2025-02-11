const express = require("express")
const app = express();
const path = require('path');
const session = require("express-session");
const passport = require("./config/passport")
const Razorpay = require("razorpay");
const env = require("dotenv").config();
const db = require("./config/db")
const flash = require('connect-flash');
const userRouter = require("./routes/userRouter")
const adminRouter = require("./routes/adminRouter")
db()

app.use(flash());

// Body parser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: {
        
        httpOnly: true, 

        maxAge: 72 * 60 * 60 * 1000
    }
}))


// Passport middleware
app.use(passport.initialize()); 
app.use(passport.session()); 




// View engine setup
app.set("view engine", "ejs")
app.set("views", [path.join(__dirname, "views/user"), path.join(__dirname, "views/admin")])
app.use(express.static(path.join(__dirname, "public")))


// Routes
app.use("/", userRouter)
app.use("/admin", adminRouter);  
// app.use('/', dashboardRoutes);

// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,    
//     key_secret: process.env.RAZORPAY_KEY_SECRET
// })
 

const PORT = 3000
app.listen(PORT, () => {
    console.log("server is running")
})


module.exports = app;   