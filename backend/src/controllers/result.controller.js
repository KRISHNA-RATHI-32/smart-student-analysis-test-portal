import mongoose from "mongoose";
import { Result } from "../modles/result.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Test } from "../modles/test.model.js";

const getLeaderboardByTest = asyncHandler(async (req, res) => {

  const { testId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const aggregate = Result.aggregate([

    // Stage A: Filter by test
    {
      $match: {
        test: new mongoose.Types.ObjectId(testId)
        //It does three things:
        // Validation: It checks if the string you passed is a valid 24-character hex. If it’s not (e.g., "abc-123"), it will throw an error.
        // Conversion: It transforms that string into binary data.
        // The Handshake: It allows MongoDB to perform a lightning-fast binary comparison between your query and the documents stored on the disk.

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

const getMyRank = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const studentId = req.user._id;
  const results = await Result.find({ test: testId })
    .sort({ score: -1, timeTake: 1 })
    .select("student");
  if (!results.lenght) {
    throw new ApiError(404, "No results found in this test")
  }
  let rank = null;
});

const getMyResults = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const results = await Result.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId)
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
            { $multiply: [{ $divide: ["$score", $totalMarks] }, 100] }, 0
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
            }
          ]
        }
      }
    }

  ]);
  return res.status(200).json(new ApiResponse(200, data[0] || { overallAccuray: 0 }, "overall accuracy fetched"))
});
const getMyProgressGraph = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const progress = await Result.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId)
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
  return res.status(200).json(new ApiResponse(200, progress, "Progress graph data fetched")) ;
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
        totalQuestions: { $sum: 1 },//it acts as a counter to count the total number of questions
        correctAnswers: {
          $sum: {
            $cond: ["$answers.isCorrect", 1, 0]//it is simply used as the ternary operator in which if the answer is correct it will return 1 otherwise 0 to count the total number of correct answers
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
  const studentId = user.req._id;
  const analysis = await Result.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $unwind: "answers"
    },
    {
      $group: {
        _id: "$answers.topic",
        totalQuestions: { $sum: 1 },
        correctAnswers: {
          $sum: {
            $cond: ["answers.isCorrect", 1, 0]
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
            { $eq: ["$totalQuestions", 0] }, // Condition: Kya totalQuestions 0 hai?
            0,                               // If True: 0 return karo
            { $divide: ["$totalTime", "$totalQuestions"] } // If False: Divide karo
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
          $cond: [
            {
              $and: [
                { $gt: ["$accuracy", 75] },
                { $lt: ["$avgTime", 60] }
              ]
            },
            "Fast & Accurate",
            {
              $cond: [
                {
                  $and: [
                    { $lt: ["accuracy", 50] },
                    { $gt: ["$avgTime", 90] }
                  ]
                },
                "Slow & Inaccurate",
                "Moderate"
              ]
            }
          ]
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
  const newAttempt = await Result.create({
    student: req.user._id,
    test: testId,
    status: "started",
    startTime: new Date()
  });
  return res.status(201).json(
    new ApiResponse(201, newAttempt, "Test started successfully")
  );

})

const submitTest = asyncHandler(async (req, res) => {
  //matching the answers

  const { testId } = req.params;
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
        //we have made an array if the options are only one element the the only element will be string and json.stringify works as JSON.stringify(["4"]) → '["4"]'

        // JSON.stringify("4") → '"4"'

        // Result: false (Even though the answer is technically right!).
        const sortedCorrect = [...q.correctAnswer].sort().map(String);//map individually converty to string for extra saftey measure
        const sortedSubmitted = [...currentSubmittedAnswer].sort().map(String);


        isCorrect =
          JSON.stringify(sortedCorrect) ===
          JSON.stringify(sortedSubmitted);//with spread opertor we have created a shallo copy

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
        topic: q.topic // Storing topic for future performance analytics but this is not a good approach because if in future we want to change the topic name then it will create problem in analytics so better approach is to store the topic id and then refer it to topic collection to get the topic name but for now we are doing this for simplicity this is not working although we have stored the topic name in result collection because we are storing the topic name from question collection and in question collection we have stored the topic name as string but in result collection we are storing the topic name as object id so we have to change the topic name in question collection to object id and then refer it to topic collection to get the topic name but for now we are doing this for simplicity

      })

      TotalMarksCalculated += q.marks;
    })
  })
  //finaly save in db
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
      accuracy: ((correctCount / processedAnswers.length) * 100).toFixed(2) + "%"
    }
  }, "Test Submitted successfully!:"))
})
const getAttemptStatus = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const attempt = await Result.findOne({
    student: req.user._id,
    test: testId
  }).select("status startTime timeTaken score");
  if (!attempt) {
    return res.status(200).json(
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
  const { page = 1, limit = 10 } = req.query;
  //Jab hum URL ke peeche question mark (?) lagate hain, toh uske baad jo kuch bhi likha hota hai, use Query String kehte hain. Express automatically unhe ek object mein convert karke req.query mein daal deta hai.
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
        timeTake: 1,
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
  return res.status(200).json(200, new ApiResponse(200, submissions, "Paginated test submissions fetched"))
})
export { getLeaderboardByTest, getMyRank, getMyResults, getMyOverallAccuracy, getMyProgressGraph, getTopicsWiseAnalysis, getSpeedVsAccuracyAnalysis, startTest, submitTest, getAttemptStatus, getTestSubmissions };