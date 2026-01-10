import { Router } from "express";
import { addQuestionToSection, createTest, getAllTests, getTestById, getTestQuestions,submitTest } from "../controllers/test.controller.js";
import { verifyJWT,verifyIsTeacher } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {getLeaderboardByTest} from "../controllers/result.controller.js"
const router=Router()
router.route(
  "/leaderboard/:testId").get(
  verifyJWT,
  getLeaderboardByTest
);