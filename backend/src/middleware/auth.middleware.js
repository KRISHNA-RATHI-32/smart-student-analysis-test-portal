import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../modles/user.model.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }

  req.user = user;
  next();
});

// Teachers AND admins can access teacher routes
export const verifyIsTeacher = asyncHandler((req, res, next) => {
  if (req.user?.role !== "teacher" && req.user?.role !== "admin") {
    throw new ApiError(403, "Access Denied: Only teachers can perform this action");
  }
  next();
});

// Only admins
export const verifyIsAdmin = asyncHandler((req, res, next) => {
  if (req.user?.role !== "admin") {
    throw new ApiError(403, "Access Denied: Only admins can perform this action");
  }
  next();
});
