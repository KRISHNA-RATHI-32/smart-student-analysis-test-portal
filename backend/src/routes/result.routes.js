import { Router } from "express";
import { startTest,
        submitTest,
        getAttemptStatus,
        getMyResults,
        getMyRank,
        getLeaderboardByTest,
        getTopicsWiseAnalysis,
        getSpeedVsAccuracyAnalysis,
        getMyProgressGraph,
        getTestSubmissions
     } from "../controllers/result.controller.js";
import { verifyJWT,verifyIsTeacher } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
const router=Router()
//attempt lifecycle
router.post("/start/:testId",verifyJWT,startTest);
router.post("/submit/:testId",verifyJWT,submitTest);
router.get("/attempt-status/:testId",verifyJWT,getAttemptStatus);
//student n 
router.get("/my-results",verifyJWT,getMyResults);
router.get("/my-rank/:testId",verifyJWT,getMyRank);
//leaderboard
router.route(
  "/leaderboard/:testId").get(
  verifyJWT,
  getLeaderboardByTest
);
//analytics 
router.get("/topics-wise-analysis",verifyJWT,getTopicsWiseAnalysis);
router.get("/speed-vs-accuracy",verifyJWT,getSpeedVsAccuracyAnalysis);
router.get("/progress-graph",verifyJWT,getMyProgressGraph);
//teacher
router.get("/teacher/submissions/:testId",verifyJWT,verifyIsTeacher,getTestSubmissions)
export default router;