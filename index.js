import express from "express"
import path from "path"
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const MONGOURI = "mongodb://localhost:27017";
mongoose.connect(MONGOURI,{
    dbName:"BackEndTesting",
}).then(c=>console.log("Database Connected")).catch(e=>console.log(e));

const messageSchema = new mongoose.Schema({
    name:String,
    email:String,
})
const Message = mongoose.model("Messages", messageSchema)

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
})

const User = mongoose.model("User",userSchema)

const isAuthenticated = async (req,res,next)=>{
    const { token } = req.cookies;
    //verify if the token is present
    if(token)
    {
        const decoded = jwt.verify(token,"jwt-secret")
        // if token exits store the data of the user 
        req.user = await User.findById(decoded._id);
        next();
    }
    else
    {
        res.redirect("/login");
    }
}
//server is created and can be used using app variable
const app = express();
//setting up view engine
app.set("view engine","ejs")
console.log(path.resolve());
const pathLocation = path.resolve();
const staticPath = path.join(pathLocation,"public")
// below is a middleware so we need to use app.use() method and pass the middleware
app.use(express.static(staticPath))
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    console.log(req.body);  // Check if you are getting the data correctly

    let user = await User.findOne({ name });
    if (user) {
        res.redirect("/login");
    } 
    else {
        const hashedPassword = await bcrypt.hash(password,10);
        // User does not exist, create a new user
        user = await User.create({ name: name, email: email, password: hashedPassword });
        const token = jwt.sign({ _id: user._id }, "jwt-secret");
        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 10000)
        });
        console.log(user);  // Check if user is being created and added to the DB
        res.redirect("/login");
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        return res.redirect("/register");  // Ensure you stop further execution
    }

    const isMatch = await bcrypt.compare(password,user.password);

    if (isMatch) {
        const token = jwt.sign({ _id: user._id }, "jwt-secret");
        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 10000)
        });
        // Send response and stop execution
        return res.render("logout", { name: user.name });
    } 
    // If password does not match, return response and stop further execution
    return res.render("login", {email,message: "Incorrect password" });
});

app.get('/', isAuthenticated, (req, res) => {
    res.render("logout",{name:req.user.name});
});

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires: new Date(Date.now())
    })
    res.redirect("/")
})
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
