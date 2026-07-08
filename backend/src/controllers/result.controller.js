import mongoose from "mongoose";
import { Result } from "../modles/result.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Test } from "../modles/test.model.js";

const validateTestId = (testId) => {
  if (!mongoose.isValidObjectId(testId)) {
    throw new ApiError(400, "Invalid test id");
  }
};

const getLeaderboardByTest = asyncHandler(async (req, res) => {

  const { testId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  validateTestId(testId);
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const aggregate = Result.aggregate([

    // Stage A: Filter by test
    {
      $match: {
        test: new mongoose.Types.ObjectId(testId),status:"completed"
      }
    },

    // Stage B: Join users
    {
      $lookup: {//by usin lookup we are joining the result model with the user model to get the student details like name which we want to show in the leaderboard
        from: "users",
        localField: "student",//local field is the field in the result model which contains the student id
        foreignField: "_id",
        as: "student"
      }//actually we have only one student for each result but lookup always returns an array so we will get an array of one element, we will unwind it in the next stage
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
    page: pageNum,
    limit: limitNum
  };

  const leaderboard = await Result.aggregatePaginate(aggregate, options);

  // Stage F: Rank calculation
  leaderboard.docs = leaderboard.docs.map((item, index) => ({
    rank: (pageNum - 1) * limitNum + index + 1,
    ...item
  }));

  return res.status(200).json(
    new ApiResponse(200, leaderboard, "Leaderboard fetched successfully")
  );
});

const getMyRank = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  validateTestId(testId);
  const studentId = req.user._id;
  const results = await Result.find({ test: testId,status:"completed" })
    .sort({ score: -1, timeTaken: 1 })
    .select("student");//we are only selecting the student field because we only need the student id to calculate the rank, we don't need other details
  if (!results.length) {
    throw new ApiError(404, "No results found in this test")
  }
  let rank = null;
  for (let i = 0; i < results.length; i++) {
    if (results[i].student.toString() === studentId.toString()) {
      rank = i + 1;
      break;
    }
  }
  return res.status(200).json(
    new ApiResponse(200, { rank, totalStudents: results.length }, "Rank fetched")
  );
});

const getMyResults = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const results = await Result.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        status:"completed"
      }
    },
    {
      $lookup: {
        from: "tests",
        localField: "test",
        foreignField: "_id",
        as: "test"
      }
    },
    {
      $unwind: "$test",
    },
    {
      $project: {
        score: 1,
        totalMarks: 1,
        timeTaken: 1,
        createdAt: 1,
        testTitle: "$test.title",
        accuracy: {
          $cond: [
            { $gt: ["$totalMarks", 0] },
            { $multiply: [{ $divide: ["$score", "$totalMarks"] }, 100] }, 0
          ]
        }
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    }

  ]);
  return res.status(200).json(
    new ApiResponse(200, results, "MY results fetched successfully")
  )


});
const getMyOverallAccuracy = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const data = await Result.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId)
      },
    },
    {
      $group: {
        _id: null,
        totalScore: { $sum: "$score" },
        totalMarks: { $sum: "$totalMarks" }
      }
    },
    {
      $project: {
        _id: 0,
        totalScore: 1,
        totalMarks: 1,
        overallAccuracy: {
          $cond: [
            { $gt: ["$totalMarks", 0] },
            {
              $multiply: [{ $divide: ["$totalScore", "$totalMarks"] }, 100]
            },
            0
          ]
        }
      }
    }

  ]);
  return res.status(200).json(new ApiResponse(200, data[0] || { overallAccuracy: 0 }, "overall accuracy fetched"))
});
//in the below function we are calculating the progress of the student over time by fetching all the results of the student and then calculating the accuracy for each result and returning it in a format which can be easily used to plot a graph in the frontend, we are also sorting the results by createdAt field to show the progress in chronological order
const getMyProgressGraph = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const progress = await Result.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        status:"completed"
      }
    },
    {
      $lookup: {
        from: "tests",
        localField: "test",
        foreignField: "_id",
        as: "test"
      }

    },
    { $unwind: "$test" },
    {
      $project: {
        _id: 0,
        createdAt: 1,
        testTitle: "$test.title",
        accuracy: {
          $cond: [
            { $gt: ["$totalMarks", 0] },
            { $multiply: [{ $divide: ["$score", "$totalMarks"] }, 100] }
            , 0]
        }
      }
    },
    {
      $sort: {
        createdAt: 1
      }
    }

  ]);
  return res.status(200).json(new ApiResponse(200, progress, "Progress graph data fetched"));
})
const getTopicsWiseAnalysis = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const topicAnalysis = await Result.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $unwind: "$answers"
    },
    {
      $group: {
        _id: "$answers.topic",
        totalQuestions: { $sum: 1 },
        correctAnswers: {
          $sum: {
            $cond: ["$answers.isCorrect", 1, 0]
          }

        },
        avgTime: { $avg: "$answers.timeSpent" }
      }
    },
    {
      $project: {
        topic: "$_id",
        totalQuestions: 1,
        correctAnswers: 1,
        avgTime: 1,
        accuracy: {
          $cond: [{ $gt: ["$totalQuestions", 0] },
          {
            $multiply: [{ $divide: ["$correctAnswers", "$totalQuestions"] }, 100]
          }, 0
          ]
        }
      }
    },
    {
      $project: {
        _id: 0,
        topic: 1,
        accuracy: 1,
        avgTime: 1,
        status: {
          $cond: [
            { $lt: ["$accuracy", 50] },
            "Weak",
            {
              $cond: [
                { $lt: ["$accuracy", 75] },
                "Medium",
                "Strong"
              ]
            }
          ]
        }
      }
    },
    { $sort: { accuracy: 1 } }
  ]);
  return res.status(200).json(new ApiResponse(200, topicAnalysis, "Weak topic analysis fetched"));
});
const getSpeedVsAccuracyAnalysis = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const analysis = await Result.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $unwind: "$answers"
    },
    {
      $group: {
        _id: "$answers.topic",
        totalQuestions: { $sum: 1 },
        correctAnswers: {
          $sum: {
            $cond: ["$answers.isCorrect", 1, 0]
          }
        },
        totalTime: { $sum: "$answers.timeSpent" }
      }
    },
    {
      $project: {
        topic: "$_id",
        totalQuestions: 1,
        avgTime: {
          $cond: [
            { $eq: ["$totalQuestions", 0] },
            0,
            { $divide: ["$totalTime", "$totalQuestions"] }
          ]
        },
        accuracy: {
          $cond: [
            { $eq: ["$totalQuestions", 0] },
            0,
            {
              $multiply: [
                { $divide: ["$correctAnswers", "$totalQuestions"] },
                100
              ]
            }
          ]
        }
      }
    },
    {
      $project: {
        _id: 0,
        topic: 1,
        avgTime: 1,
        accuracy: 1,
        performance: {
          $switch: {
            branches: [
              {
                case: { $and: [{ $gt: ["$accuracy", 75] }, { $lt: ["$avgTime", 60] }] },
                then: "Fast & Accurate"
              },
              {
                case: { $and: [{ $lt: ["$accuracy", 50] }, { $gt: ["$avgTime", 90] }] },
                then: "Slow & Inaccurate"
              },
              {
                case: { $and: [{ $gt: ["$accuracy", 75] }, { $gt: ["$avgTime", 90] }] },
                then: "Accurate but Slow"
              }
            ],
            default: "Moderate"
          }
        }
      }
    }
    , { $sort: { accuracy: -1 } }
  ]);
  return res.status(200).json(
    new ApiResponse(200, analysis, "speed vs Accuracy analysis fetched")
  )
});
const startTest = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  validateTestId(testId);
  const alreadyCompleted = await Result.findOne({
    student: req.user._id,
    test: testId,
    status: "completed"
  });
  if (alreadyCompleted) {
    throw new ApiError(403, "Test already attempted");
  }
  const alreadyStarted = await Result.findOne({
    student: req.user._id,
    test: testId,
    status: "started"
  });
  if (alreadyStarted) {
    return res.status(200).json(
      new ApiResponse(200, alreadyStarted, "Test already started")
    );
  }
  try {
    const newAttempt = await Result.create({
      student: req.user._id,
      test: testId,
      status: "started",
      startTime: new Date()
    });
    return res.status(201).json(new ApiResponse(201, newAttempt, "Test started successfully"));
  } catch (err) {
    if (err.code === 11000) {
      // Caught the race condition: fetch and return the one that just got created
      const existing = await Result.findOne({ student: req.user._id, test: testId });
      return res.status(200).json(new ApiResponse(200, existing, "Test already started"));
    }
    throw err;
  }

})

const submitTest = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  validateTestId(testId);
  const { answers, timeTaken } = req.body;
  const test = await Test.findById(testId);
  if (!test) throw new ApiError(404, "Test not found");
  const result = await Result.findOne({
    student: req.user._id,
    test: testId
  })
  if (!result) throw new ApiError(403, "Test not started yet");
  if (result.status === "completed") {
    throw new ApiError(403, "Test already submitted");
  }
  // --- SERVER-SIDE TIMER ENFORCEMENT START ---
  const elapsedSeconds = (Date.now() - result.startTime.getTime()) / 1000;
  const allowedSeconds = test.duration * 60 + 30; // 30-second grace period for network lag
  // Cap the recorded time to the max duration, completely ignoring the frontend's payload
  const calculatedTimeTaken = Math.min(elapsedSeconds, test.duration * 60);
  if (elapsedSeconds > allowedSeconds) {
      // Optional: You could throw an error here, but silently capping the time 
      // and grading what they submitted is usually better UX for network drops.
      throw new ApiError(403, "Test time limit exceeded");
  }
  let answersMap = new Map(answers.map((a) => [a.questionId, a]))
  let finalScore = 0;
  let TotalMarksCalculated = 0;
  let wrongCount = 0;
  let correctCount = 0;
  const processedAnswers = [];
  test.sections.forEach(section => {
    section.questions.forEach(q => {
      const studentAns = answersMap.get(q._id.toString());
      let isCorrect = false;
      let currentSubmittedAnswer = [];
      if (studentAns) {
        currentSubmittedAnswer = Array.isArray(studentAns.options) ? studentAns.options : [studentAns.options];
        const sortedCorrect = [...q.correctAnswer].sort().map(String);
        const sortedSubmitted = [...currentSubmittedAnswer].sort().map(String);

        isCorrect =
          JSON.stringify(sortedCorrect) ===
          JSON.stringify(sortedSubmitted);

        if (isCorrect) {
          finalScore += q.marks;
          correctCount++;
        }
        else {
          finalScore -= q.negativeMarks;
          wrongCount++;
        }
      }
      processedAnswers.push({
        questionId: q._id,
        submittedAnswer: currentSubmittedAnswer,
        isCorrect: isCorrect,
        timeSpent: studentAns ? studentAns.timeSpent : 0,
        topic: q.topic
      })

      TotalMarksCalculated += q.marks;
    })
  })
  if (finalScore < 0) finalScore = 0;
  result.score = finalScore;
  result.status = "completed";
  result.totalMarks = TotalMarksCalculated;
  result.answers = processedAnswers;
  result.timeTaken = timeTaken || 0
  result.submittedAt = new Date();
  await result.save()
  return res.status(200).json(new ApiResponse(200, {
    result,
    summary: {
      totalQuestions: processedAnswers.length,
      correct: correctCount,
      incorrect: wrongCount,
      accuracy: (processedAnswers.length ? ((correctCount / processedAnswers.length) * 100) : 0).toFixed(2) + "%"
    }
  }, "Test Submitted successfully!:"))
})
const getAttemptStatus = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  validateTestId(testId);
  const attempt = await Result.findOne({
    student: req.user._id,
    test: testId
  }).select("status startTime timeTaken score");
  if (!attempt) {
    return res.status(200).json(//we are returning 200 status code here because the request is successful but the test is not started yet, we are also returning a custom status in the response to indicate that the test is not started yet
      new ApiResponse(200, { status: "not-started" }, "Test not started yet")
    );

  }
  return res.status(200).json(
    new ApiResponse(200, {
      status: attempt.status,
      startTime: attempt.startTime,
      timeTaken: attempt.timeTaken || 0,
      score: attempt.score
    }, "Attempt status fetched")
  );
})
const getTestSubmissions = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  validateTestId(testId);
  const { page = 1, limit = 10 } = req.query;
  const aggregate = Result.aggregate([
    {
      $match: {
        test: new mongoose.Types.ObjectId(testId),
        status: "completed"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $project: {
        studentName: "$student.fullName",
        score: 1,
        totalMarks: 1,
        timeTaken: 1,
        submittedAt: "$submittedAt",
        accuracy: {
          $cond: [
            { $gt: ["$totalMarks", 0] },
            {
              $multiply: [
                { $divide: ["$score", "$totalMarks"] },
                100
              ]
            }, 0
          ]
        }
      }
    },
    {
      $sort: { score: -1, timeTaken: 1 }
    }
  ]);
  const options = {
    page: Number(page),
    limit: Number(limit)
  };
  const submissions = await Result.aggregatePaginate(aggregate, options);
  return res.status(200).json(new ApiResponse(200, submissions, "Paginated test submissions fetched"))
})
export { getLeaderboardByTest, getMyRank, getMyResults, getMyOverallAccuracy, getMyProgressGraph, getTopicsWiseAnalysis, getSpeedVsAccuracyAnalysis, startTest, submitTest, getAttemptStatus, getTestSubmissions };