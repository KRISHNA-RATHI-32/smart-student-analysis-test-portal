import { Router } from "express";
import { loginUser, logoutUser,registerUser ,changePassword,getCurrentuser, refreshAccessToken} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Ye ek dummy route hai bas check karne ke liye

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT,logoutUser);
router.post("/change-password",verifyJWT,changePassword)//isme logout isliye kiya taki cookies bhi erase ho jaye kyoki hum sirf refresh token ko hata rhe hai likin user access token expire hone tak login rhega isliye 
router.get("/me",verifyJWT,getCurrentuser);
router.post("/refresh-token",refreshAccessToken)
export default router;