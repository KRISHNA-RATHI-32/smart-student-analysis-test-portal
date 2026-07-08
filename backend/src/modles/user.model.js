import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { type } from "os";

const userSchema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  batch: {
    type: Schema.Types.ObjectId,
    ref: "Batch"
  },
  avatar:{type:String,default:""},
  phone:{
    type:String,
  },
  isActive:{type:Boolean,default:true},
  children:[{type:Schema.Types.ObjectId,ref:"User"}],
  role:{type:String,enum:["student","teacher","admin","parent"],default:"student"},
  refreshToken: String
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({
    _id: this._id,
    email: this.email,
    role: this.role,
    fullName: this.fullName
  }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({
    _id: this._id
  }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  });
};

export const User = mongoose.model("User", userSchema);
