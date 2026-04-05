import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../modles/user.model.js"

// ─── Add Teacher (admin only) ───
const addTeacher = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((f) => !f || f.trim() === "")) {
    throw new ApiError(400, "All fields are mandatory");
  }

  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Admin creates teacher — auto-verified, no OTP needed
  const teacher = await User.create({
    fullName,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
    role: "teacher",
    isVerified: true
  });

  const createdTeacher = await User.findById(teacher._id).select("-password -refreshToken");

  return res.status(201).json(
    new ApiResponse(201, createdTeacher, "Teacher account created successfully")
  );
});

// ─── Get All Users (admin only) ───
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password -refreshToken")
    .sort("-createdAt");

  return res.status(200).json(
    new ApiResponse(200, users, "All users fetched successfully")
  );
});

// ─── Delete User (admin only) ───
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Can't delete yourself or other admins
  if (user.role === "admin") {
    throw new ApiError(403, "Cannot delete an admin account");
  }

  await User.findByIdAndDelete(userId);

  return res.status(200).json(
    new ApiResponse(200, {}, "User deleted successfully")
  );
});

export { addTeacher, getAllUsers, deleteUser };
