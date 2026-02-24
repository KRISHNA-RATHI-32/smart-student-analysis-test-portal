import{ApiError}from "../utils/ApiError.js"
import{asyncHandler}from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../modles/user.model.js"

export const verifyJWT=asyncHandler(async(req,res ,next)=>{
    
        // 1. Get the token from cookies or the Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        // 2. Decode/Verify the token using our Secret Key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 3. Find the user in the database using the ID inside the token
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // 4. Attach the user object to the request (req.user)
        // Now every controller after this will know who the user is!
        req.user = user;
        next();
   
    
})
export const verifyIsTeacher = asyncHandler((req, res, next) => {
    // We can only use this after verifyJWT because verifyJWT sets 'req.user'
    if (req.user?.role !== "teacher") {
        throw new ApiError(403, "Access Denied: Only teachers can perform this action");
    }
    next();
});
