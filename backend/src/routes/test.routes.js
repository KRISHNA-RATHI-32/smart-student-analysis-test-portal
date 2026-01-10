import { Router } from "express";
import { addQuestionToSection, createTest, getAllTests, getTestById, getTestQuestions,submitTest } from "../controllers/test.controller.js";
import { verifyJWT,verifyIsTeacher } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router=Router();
router.route("/create-test").post(
    verifyJWT,
    verifyIsTeacher,
    upload.single("thumbnail"),
    createTest
)
router.route("/add-question/:testId/:sectionName").post(verifyJWT,verifyIsTeacher,addQuestionToSection);
router.route("/all-tests").get(verifyJWT,getAllTests);
router.route("/t/:testId").get(verifyJWT,getTestById);
router.route("/questions/:testId").get(verifyJWT,getTestQuestions)
router.route("/submit/:testId").post(verifyJWT,submitTest);
export default router