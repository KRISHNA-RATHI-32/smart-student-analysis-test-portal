import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../modles/user.model.js"
import { Otp } from "../modles/otp.model.js"
import { sendOtpEmail } from "../utils/sendEmail.js"
import { cookieOptions } from "../utils/cookieOptions.js"
import jwt from "jsonwebtoken"

// ─── Helper: generate 6-digit OTP ───
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── STEP 1: Register → creates unverified user + sends OTP ───
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((f) => !f || f.trim() === "")) {
    throw new ApiError(400, "All fields are mandatory");
  }

  // Only students can self-register. Teachers/admins are created by admin.
  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
  });

  if (existedUser && existedUser.isVerified) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // If an unverified user exists with the same email, delete and re-create
  if (existedUser && !existedUser.isVerified) {
    await User.findByIdAndDelete(existedUser._id);
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
    role: "student",       // ALWAYS student for self-registration
    isVerified: false
  });

  // Generate and send OTP
  const otp = generateOtp();
  console.log(`[DEV ONLY] OTP for ${email.toLowerCase()}: ${otp}`);
  await Otp.deleteMany({ email: email.toLowerCase() }); // Clear old OTPs
  await Otp.create({ email: email.toLowerCase(), otp });
  await sendOtpEmail(email, otp);

  return res.status(201).json(
    new ApiResponse(201, { email: user.email }, "OTP sent to your email. Please verify to complete registration.")
  );
});

// ─── STEP 2: Verify OTP → activates account + logs in ───
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp });//it matches and finds the matched field
  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  // Clean up OTPs
  await Otp.deleteMany({ email: email.toLowerCase() });

  // Auto-login after verification
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { user: loggedInUser }, "Email verified and logged in successfully"));
});

// ─── Resend OTP ───
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, "No registration found for this email");
  if (user.isVerified) throw new ApiError(400, "Email is already verified");

  const otp = generateOtp();
  // console.log(`[DEV ONLY] Resent OTP for ${email.toLowerCase()}: ${otp}`);
  await Otp.deleteMany({ email: email.toLowerCase() });
  await Otp.create({ email: email.toLowerCase(), otp });
  await sendOtpEmail(email, otp);

  return res.status(200).json(
    new ApiResponse(200, { email }, "OTP resent successfully")
  );
});

// ─── Login ───
const loginUser = asyncHandler(async (req, res) => {

  const { email, username = " ", password } = req.body;
  // console.log(req.body);

  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() }
    ]
  });
  // console.log(user);
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }


  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  // Block unverified users
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email first. Check your inbox for the OTP.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const options = { httpOnly: true, secure: false, sameSite: "lax" };
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser ,accessToken,refreshToken}, "Logged in successfully"));
});

// ─── Logout ───
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });
  const options = { httpOnly: true, secure: false, sameSite: "lax" };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// ─── Refresh Access Token ───
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Refresh token missing");

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decoded._id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token expired or revoked");
  }

  const accessToken = user.generateAccessToken();
  const options = { httpOnly: true, secure: false, sameSite: "lax" };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, {}, "Access token refreshed"));
});

// ─── Change Password ───
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) throw new ApiError(400, "Old and new password required");

  const user = await User.findById(req.user._id);
  const isCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isCorrect) throw new ApiError(401, "Old password is incorrect");

  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  const options = { httpOnly: true, secure: false, sameSite: "lax" };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// ─── Get Current User ───
const getCurrentuser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, "No user found with this email");
  const otp = generateOtp();
  console.log(`[DEV ONLY] Password reset OTP for ${email.toLowerCase()}: ${otp}`);
  await Otp.deleteMany({ email: email.toLowerCase() });
  await Otp.create({ email: email.toLowerCase(), otp });
  await sendOtpEmail(email, otp, "Password Reset OTP");
  return res.status(200).json(new ApiResponse(200, { email }, "OTP sent to your email for password reset"));
})
const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");
  
  const otpRecord=await Otp.findOne({email:email.toLowerCase(),otp});
  if(!otpRecord) throw new ApiError(400<"Invalid or expired OTP");
  return res.status(200).json(new ApiResponse(200,{email},"OTP verified. You can now reset your password"));
})
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword} = req.body;
  if(!email || !otp || !newPassword) throw new ApiError(400, "Email, OTP and new password are required");
  const otpRecord=await Otp.findOne({email:email.toLowerCase(),otp});
  if(!otpRecord) throw new ApiError(400<"Invalid or expired OTP");
  const user=await User.findOne({email:email.toLowerCase()});
  if(!user) throw new ApiError(404,"User not found");
  user.password=newPassword;
  await user.save({validateBeforeSave:false});
  await Otp.deleteMany({email:email.toLowerCase()});
  return res.status(200).json(new ApiResponse(200,{}, "Password reset successfully. Please log in with your new password"));

})
export {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  logoutUser,
  changePassword,
  getCurrentuser,
  refreshAccessToken,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword
};