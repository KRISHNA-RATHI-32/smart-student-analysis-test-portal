import mongoose from "mongoose";
import { Result } from "../models/result.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const getLeaderboardByTest = asyncHandler(async (req, res) => {

  const { testId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const aggregate = Result.aggregate([

    // Stage A: Filter by test
    {
      $match: {
        test: new mongoose.Types.ObjectId(testId)
      }
    },

    // Stage B: Join users
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "student"
      }
    },

    // Stage C: Flatten
    { $unwind: "$student" },

    // Stage D: Shape & calculate
    {
      $project: {
        score: 1,
        timeTaken: 1,
        totalMarks: 1,
        studentName: "$student.fullName",

        accuracy: {
          $cond: [
            { $gt: ["$totalMarks", 0] },
            { $multiply: [{ $divide: ["$score", "$totalMarks"] }, 100] },
            0
          ]
        }
      }
    },

    // Stage E: Sort for ranking
    {
      $sort: {
        score: -1,
        timeTaken: 1
      }
    }

  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit)
  };

  const leaderboard = await Result.aggregatePaginate(aggregate, options);

  // Stage F: Rank calculation
  leaderboard.docs = leaderboard.docs.map((item, index) => ({
    rank: (page - 1) * limit + index + 1,
    ...item
  }));

  return res.status(200).json(
    new ApiResponse(200, leaderboard, "Leaderboard fetched successfully")
  );
});

const getMyRank=asyncHandler(async(res,res)=>{
    const {testId}=req.params;
    const studentId=req.user._id;
    const results=await Result.find({test:testId})
    .sort({score:-1,timeTake:1})
    .select("student");
    if(!results.lenght){
        throw new ApiError(404,"No results found in this test")
    }
    let rank=null;
})