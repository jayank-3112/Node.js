import express from "express"
import { readFileSync } from "fs";
import path from "path"
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

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
    email:String,
    password:String,
})

const User = mongoose.model("User",userSchema)

const isAuthenticated = (req,res,next)=>{
    const { token } = req.cookies;
    if(token)
    {
        next();
    }
    else
    {
        res.render("login",{name:"jayank"});
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
app.get('/', isAuthenticated, (req, res) => {
    res.render("logout");
});
app.post("/login",async (req,res)=>{
    console.log(req.body);
    const { email, password } = req.body;
    const user = await User.create({email:email,password:password})
    res.cookie("token",user._id ,{
        httpOnly:true,
        expires: new Date(Date.now() + 60*10000)
    })
    res.redirect("/")
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
