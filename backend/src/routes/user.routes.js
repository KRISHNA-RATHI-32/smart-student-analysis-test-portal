import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  logoutUser,
  changePassword,
  getCurrentuser,
  refreshAccessToken
} from "../controllers/user.controller.js";

const router = Router();

// Public routes (no auth needed)
router.route("/register").post(registerUser);
router.route("/verify-otp").post(verifyOtp);
router.route("/resend-otp").post(resendOtp);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes (auth needed)
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/me").get(verifyJWT, getCurrentuser);

export default router;