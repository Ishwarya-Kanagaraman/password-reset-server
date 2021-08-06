import mongoose from "mongoose";


const userSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    mobileNo:{
        type:Number,
        required:true
    }
})
export const Users=mongoose.model("user",userSchema);
// export const Students = mongoose.model("student", studentSchema);