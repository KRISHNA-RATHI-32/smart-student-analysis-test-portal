import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"

const registerUser=asyncHandler(async(req ,res )=>{
    const{fullName,email,username,password,role}=req.body;
    if(
        [fullName,email,username,password,role].some((field)=>field?.trim()===""))
        {
            throw new ApiError(400,"All fields are mandatory");
        }
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    });
    if(existedUser){
        throw new ApiError(409,"User with email or username already  exists");
    }
    const user=await User.create({
        fullName,
        email,
        username,
        password,
        role:role.toLowerCase()
    })
    const createUser=await User.findById(user._id).select("-password -refreshToken");
    return res.status(201).json(
        new ApiResponse(201,createUser,"User registered successfully")
    )
})
const loginUser=asyncHandler(async(req,res)=>{
    const {email,username,password}=req.body;
    if(!(username||email)){throw new ApiError(400,"Username or email is required")}
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(400,"User does not exist")
    }
    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid password");
    }
    const accessToken=user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();
    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false});
    const options={
        httpOnly:true,
        secure:true
    }
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");
    //for security purpose we are sending tokens in the form of cookies withCredentails:true
    return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user:loggedInUser
                },
                "user logged in successfully"
            )
        )
})
const logoutUser=asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    );
    const options={
        httpOnly:true,
        secure:true
    }
    return res
            .status(200)
            .clearCookie("accessToken",options)
            .clearCookie("refreshToken",options)
            .json(new ApiResponse(200,{},"User logged out successfully"))
})
export{registerUser,loginUser,logoutUser};