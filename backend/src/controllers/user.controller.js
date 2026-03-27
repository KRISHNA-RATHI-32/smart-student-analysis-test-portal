import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../modles/user.model.js"

const generateAccessAndRefreshTokens=async(userId)=>{
    //we are using try catch block because there can be some error while generating tokens or finding user by id so we have to handle that error and send proper response to the client
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        //currently we have not exported these methods in user model so we have to do that first
        user.refreshToken=refreshToken;//giving to database
        await user.save({validateBeforeSave:false});//we have to save this refresh token in db but we do not want to validate the whole schema again and again so we have to pass this object
        return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,"something went wrong while gernerating refresh and access token ")
    }
}
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
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incommingRefreshToken=req.cookies?.refreshToken||req.body?.refreshToken;
    if(!incommingRefreshToken){
        throw new ApiError(401, "Refreshn token missing")
    }
    let decoded;
    try {
        decoded=jwt.verify(
            incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET
        );
    }
    catch{
        throw new ApiError(401,"Invalid refresh token");
    }
    const user=await User.findById(decoded._id);
    if(!user||user.refreshToken!==incommingRefreshToken){
        throw new ApiError(401, "Refresh token expired or revoked")
    }
    const accessToken=user.generateAccessToken();
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).json(new ApiResponse(200,{},"Access token refreshed"));
})
const changePassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    if(!oldPassword||!newPassword){
        throw new ApiError(400,"Old password and new password are required ");
    }
    const user=await User.findById(req.user._id);
    const isCorrect=await user.isPasswordCorrect(oldPassword);
    if(!isCorrect){
        throw new ApiError(401, "Old password is incorrect");
    }
    user.password=newPassword;
    user.refreshToken=undefined;
    await user.save({validateBeforeSave:false});
    const options={httpOnly:true,
        secure:true
    };
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(200,{},"Password Changed successfully")
})
const getCurrentuser=asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200, req.user,"Current user fetched successfully"))
})
export{registerUser,loginUser,logoutUser,changePassword,getCurrentuser,generateAccessAndRefreshTokens,refreshAccessToken};