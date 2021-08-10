import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import {userRouter} from './routes/users.js'
const app=express();
const PORT=process.env.PORT||8080;
dotenv.config();

// connect to the database
// const url=process.env.MONGO_URL;
const url="mongodb+srv://Ishwarya:Kuppu@1614013@cluster0.j0feb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
// const url="mongodb+srv://ishwarya_23:Kuppu@1614013@cluster0.i7g84.mongodb.net/Students?retryWrites=true&w=majority";
app.use(express.json());
app.use(cors());
 
mongoose.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true });
const con=mongoose.connection;
con.on("open",()=>console.log("Mongo DB is connected"))


//middleware

app.get("/",(req,res)=>{
    res.send("Welcome to Node app")
})
app.use('/',userRouter)
app.listen(PORT,()=>console.log(`server is started at ${PORT}`));