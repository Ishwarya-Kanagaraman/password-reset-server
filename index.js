import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import {userRouter} from './routes/users.js'
const app=express();
const PORT=process.env.PORT||3003;
dotenv.config();
// connect to the database
const url=process.env.MONGO_URL;

 
mongoose.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true });
const con=mongoose.connection;
con.on("open",()=>console.log("Mongo DB is connected"))


//middleware
app.use(express.json());
app.use(cors());
app.get("/",(req,res)=>{
    res.send("Welcome to Node app")
})
app.use('/',userRouter)
app.listen(PORT,()=>console.log(`server is started at ${PORT}`));