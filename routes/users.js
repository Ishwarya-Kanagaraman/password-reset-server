import { Users } from "../models/user.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
import express from "express";
import bcrypt, { genSalt } from "bcrypt";
import nodemailer from "nodemailer";
const router=express.Router();
let transporter=nodemailer.createTransport(
    {
        service: 'gmail',
        auth: {
            user: process.env.USER,
            pass: process.env.PASSWORD
        }
    }
)

router
.route('/users')
// to get the details of Users
.get(async (request,response)=>{
    try{
        const usersList=await Users.find();
        response.send(usersList);
        console.log(usersList)
    }
    catch(err){
        response.send(err);
        console.log(err);
    }
})
// to add new Users 
.post(async (request,response)=>{
  const addUser=request.body;
  console.log(addUser);
  const user=new Users(addUser);
  try{
     
     const newUser=await user.save();
     response.send({newUser,message:"created and Added successfully"})
  }
  catch(err){
      console.log(err);
  }
})
// to delete specific User
.delete(async (request,response)=>{
    const {id}=request.body;
    try{
        const findUser=await Users.findById({_id:id});
        findUser.remove();
        response.send({findUser,message:"deleted Successfully"})
    }catch(err){
        console.log(err);
    }
})
// to update the details of Users
.patch(async (request,response)=>{
    const {id,firstName,lastName,email,mobileNo}=request.body;
    try{
        const findUser=await Users.findById({_id:id});

      if(firstName){
          findUser.firstName=firstName;
      }
      if(lastName){
        findUser.lastName=lastName;
    }
    if(email){
        findUser.email=email;
    }
    if(mobileNo){
        findUser.mobileNo=mobileNo;
    }
    await findUser.save();
        response.send({findUser,message:"updated Successfully"})
    }catch(err){
        console.log(err);
    }
})
router.route('/users/signup')
.post(async(request,response)=>{
    const {firstName,lastName,email,password,mobileNo}=request.body;
    const findDuplicate=await Users.findOne({email:email});
    if(findDuplicate){
        response.send("Email already exists!")
    }
    else{
        try{
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);
        const newUser= new Users({
            firstName:firstName,
            lastName:lastName,
            email:email,
            password:hashedPassword,
            mobileNo:mobileNo
        })
        await newUser.save();
        
        const token = jwt.sign({ id: newUser._id }, "MySecretKey", {
        expiresIn: "1 day",
      })
      console.log("token is-->",token);
        console.log(newUser);
        transporter.sendMail({
            from: 'xyz@gmail.com',
            to: `${newUser.email}`,
            subject: '(Do-not-reply) signup confirmation Mail',
            // text: 'Node.js testing mail'
            html:`<h1>Hi ${newUser.firstName} ${newUser.lastName},</h1><br/><h2>Welcome to Our Creators Insititute</h2><p>
            your token is ${token} `
        },function(err,info){
            if(err){
                console.log(err)
            }
            else{
                res.send({message:"Email sent Successfully"})
                console.log("Email sent"+ info.response)
            }
        })
        response.send({newUser,message:"Registration Success!"})
    }
    catch(err){
        console.log(err)
    }
} 
})
export const userRouter=router;
