import { Users } from "../models/user.js";
import dotenv from "dotenv";
import crypto from "crypto"
import jwt from "jsonwebtoken";
import express from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
dotenv.config();
const router = express.Router();
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER,
    pass: process.env.PASSWORD,
  },
});

router
  .route("/users")
  // to get the details of Users
  .get(async (request, response) => {
    try {
      const usersList = await Users.find();
      response.send(usersList);
      console.log(usersList);
    } catch (err) {
      response.send(err);
      console.log(err);
    }
  })
  // to add new Users
  .post(async (request, response) => {
    const addUser = request.body;
    console.log(addUser);
    const user = new Users(addUser);
    try {
      const newUser = await user.save();
      response.send({ newUser, message: "created and Added successfully" });
    } catch (err) {
      console.log(err);
    }
  })
  // to delete specific User
  .delete(async (request, response) => {
    const { id } = request.body;
    try {
      const findUser = await Users.findById({ _id: id });
      findUser.remove();
      response.send({ findUser, message: "deleted Successfully" });
    } catch (err) {
      console.log(err);
    }
  })
  // to update the details of Users
  .patch(async (request, response) => {
    const { id, firstName, lastName, email, mobileNo } = request.body;
    try {
      const findUser = await Users.findById({ _id: id });

      if (firstName) {
        findUser.firstName = firstName;
      }
      if (lastName) {
        findUser.lastName = lastName;
      }
      if (email) {
        findUser.email = email;
      }
      if (mobileNo) {
        findUser.mobileNo = mobileNo;
      }
      await findUser.save();
      response.send({ findUser, message: "updated Successfully" });
    } catch (err) {
      console.log(err);
    }
  });
// to signup a user
router.route("/signup").post(async (request, response) => {
  const { firstName, lastName, email, password, mobileNo } = request.body;
  const findDuplicate = await Users.findOne({ email: email });
  if (findDuplicate) {
    response.send("Email already exists!");
  } else {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new Users({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        mobileNo,
      });
      await newUser.save();

      const token = jwt.sign({ id: newUser._id }, "MySecretKey", {
        expiresIn: "1 day",
      });
      console.log("token is-->", token);
      console.log(newUser);
      transporter.sendMail(
        {
          from: "xyz@gmail.com",
          to: `${newUser.email}`,
          subject: "(Do-not-reply) signup confirmation Mail",
          // text: 'Node.js testing mail'
          html: `<h1>Hi ${newUser.firstName} ${newUser.lastName},</h1><br/><h2>Welcome to Our Creators Insititute</h2><p>
            <a href="https://student-mentor-assign-server.herokuapp.com/verify?token=${token}">Click Here to activate your Account</a> `,
        },
        function (err, info) {
          if (err) {
            console.log(err);
          } else {
            res.send({ message: "Email sent Successfully" });
            console.log("Email sent" + info.response);
          }
        }
      );
      response.send({ newUser, message: "Registration Success!" });
    } catch (err) {
      console.log(err);
    }
  }
});
// verify after signup
router.route("/verify").get(async (request, response) => {
  try {
    const token = request.query.token;
    if (token) {
      const { id } = jwt.verify(token, "MySecretKey");
      await Users.updateOne({ _id: id }, { confirm: true });
      response.redirect("https://password-reset-client.netlify.app/");
    } else {
      response.status(401).json({ message: "Invalid Token" });
    }
  } catch (err) {
    response.status(500).send({ message: "Server Error" });
  }
});

// login function tested 100%
router.route("/login").post(async (request, response) => {
  const { email, password } = request.body;
  try {
    const findUser = await Users.findOne({ email: email });

    if (!findUser) {
      return response.status(401).send({ message: "Invalid credentials!" });
    } 
    // else if (!findUser.confirm) {
    //   return response.status(403).json({ message: "Verify Your Email-Id" });
    // } 
    else if (
      findUser &&
      (await bcrypt.compare(password, findUser.password))
    ) {
      const genToken = jwt.sign({ id: findUser._id }, "secretKey");
      response.cookie("jwtToken", genToken, {
        sameSite: "strict",
        expires: new Date(new Date().getTime() + 3600 * 1000),
        httpOnly: true,
      });
      return response.status(200).json({ message: "Logged in Successfully !" });
    } else {
      return response.status(401).send({ message: "Invalid credentials" });
    }
  } catch (err) {
    response.status(500).send(err);
    console.log(err);
  }
});
// forgot password function
router.route("/forgot-password").post(async (request, response) => {
  const { email } = request.body;
  try{
  const user = await Users.findOne({ email: email });
 
  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      console.log(err);
      return response.status(500).json({ message: "Can't generate token" });
    }
    const token = buffer.toString("hex");
    if(!user){
        response.send({message:`No user Found for this email ${email} Kindly Register and then try again `})
    }
    user.resetToken=token;
    user.expiryTime=Date.now() + 3600000;
    transporter.sendMail({
           from:"ishwaryaraman324@gmail.com",
           to:`${user.email}`,
           subject:'Password reset',
           html:`<h4>Your request for password reset has been accepted </h4><br/> <p> To reset your password, 
           <a href="https://password-reset-my-server.herokuapp.com/reset-password/${token}"> click here </a>`
    });
    response.status(200).json({ message: "Email Sent successfully." });

});
  }catch(err){
      console.log(err);
  }
});
// reset password function tested working 100%.

router.route('/reset-password/:token')
.post(async (request,response)=>{
    const{ token}=request.params;
    const {newPassword}=request.body;
    try{
      const user=await Users.find({
          resetToken:token,
          expiryTime:{$gt: Date.now()}
      })
      const salt=await bcrypt.genSalt(10);
      const hashedPassword=await bcrypt.hash(newPassword,salt);
      user.password=hashedPassword;
      user.resetToken=undefined;
      user.expiryTime=undefined;
      response.send({message:"Password Changed successfully"})
  user.save();
    }catch(err){
        console.log(err);
    }
})
export const userRouter = router;
