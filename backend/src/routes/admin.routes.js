import { Router } from "express";
import { verifyJWT, verifyIsAdmin } from "../middleware/auth.middleware.js";
import { addTeacher, getAllUsers, deleteUser } from "../controllers/admin.controller.js";

const router = Router();

// All admin routes require JWT + admin role
router.use(verifyJWT, verifyIsAdmin);

router.route("/add-teacher").post(addTeacher);
router.route("/users").get(getAllUsers);
router.route("/users/:userId").delete(deleteUser);

export default router;
