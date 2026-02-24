import { Router } from "express";
import { addQuestionToSection, createTest, getAllTests, getTestById, getTestQuestions } from "../controllers/test.controller.js";
import { verifyJWT,verifyIsTeacher } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router=Router();
router.route("/create-test").post(
    verifyJWT,
    verifyIsTeacher,
    upload.single("thumbnail"),
    createTest
)
router.route("/add-question/:testId/:sectionName").post(verifyJWT,verifyIsTeacher,
    upload.single("qustionImage"),
    addQuestionToSection);
router.route("/").get(verifyJWT,getAllTests);
router.route("/:testId").get(verifyJWT,getTestById);
router.route("/:testId/questions").get(verifyJWT,getTestQuestions)
export default router