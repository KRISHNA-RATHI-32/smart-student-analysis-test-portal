import { Router } from "express";
import { loginUser, logoutUser,registerUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Ye ek dummy route hai bas check karne ke liye
router.route("/test").get((req, res) => {
    res.send("User route is working!");
});
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT,logoutUser);

export default router;