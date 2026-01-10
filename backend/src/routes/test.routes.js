import { Router } from "express";
import { addQuestionToSection, createTest, getAllTests, getTestById, getTestQuestions } from "../controllers/test.controller";
import { verifyJWT,verifyIsTeacher } from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";

const router=Router();
router.route("/create-test").post(
    verifyJWT,
    verifyIsTeacher,
    upload.single("thumbnail"),
    createTest
)
router.route("/add-question/:testId/:sectoinName").post(verifyJWT,verifyIsTeacher,addQuestionToSection);
router.route("/all-tests").get(verifyJWT,getAllTests);
router.route("/t/:testId").get(verifyJWT,getTestById);
router.route("/questions/:testId").get(verifyJWT,getTestQuestions)
router.route("/submit/:testId").post(verifyJWT,submitTest);
export default router