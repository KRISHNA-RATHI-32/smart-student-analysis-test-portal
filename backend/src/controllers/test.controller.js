import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Test } from "../modles/test.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose"
import fs from "fs"

const validateTestId = (testId) => {
    if (!mongoose.isValidObjectId(testId)) {
        throw new ApiError(400, "Invalid test id");
    }
}
const createTest = asyncHandler(async (req, res) => {
    const { title, description, duration, totalMarks, category } = req.body;
    if ([title, duration, totalMarks].some((field) => String(field ?? "").trim() === "")) {
        throw new ApiError(400, "Title, Duration, and Total Marks are required");
    }
    const parsedDuration = Number(duration);
    const parsedTotalMarks = Number(totalMarks);
    if (!Number.isFinite(parsedDuration) || !Number.isFinite(parsedTotalMarks)) {
        throw new ApiError(400, "Duration and Total Marks must be valid numbers");
    }
    const existedTest = await Test.findOne({ title });

    if (existedTest) {
        throw new ApiError(409, "Test with this title already exists");
    }
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail image is required");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed");
    }
    const test = await Test.create({
        title,
        description,
        duration: parsedDuration,
        totalMarks: parsedTotalMarks,
        category,//ye category field is not defined in the model but we can add it dynamically in the document as mongodb is schema less in nature,this contains the category of the test like math,science etc which will help in filtering the test based on category
        thumbnail: thumbnail.url,
        teacher: req.user._id
    })
    return res
        .status(201)
        .json(new ApiResponse(201, test, "Test created successfully"));
});
const addSection = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const { sectionName } = req.body;
    if (!sectionName) throw new ApiError(400, "Section name is required");
    const test = await Test.findByIdAndUpdate(
        testId,
        {
            $push: {
                sections: {
                    sectionName, questions: []
                }
            },
        },
        { new: true }//this will return the updated document because by default it returns the old one 

    )
    if (!test) {
        throw new ApiError(404, "Test not found");
    }
    return res.status(200).json(new ApiResponse(200, test, "Section added successfully"));
})
const addQuestionToSection = asyncHandler(async (req, res) => {
    const { testId, sectionName } = req.params;
    validateTestId(testId);//we are validating the test id to make sure it is a valid mongodb object id
    const {
        questionText,
        questionType,
        options,
        correctAnswer,
        marks,
        negativeMarks,
        topic,
        difficulty,
    } = req.body;
    // const providedOptions=JSON.parse(options);
    let providedOptions;
    try {
        providedOptions = typeof options === "string" ? JSON.parse(options) : options;
    } catch (error) {
        // If parsing fails, we handle it gracefully instead of crashing
        if (req.file) fs.unlinkSync(req.file.path);
        throw new ApiError(400, "Options must be a valid JSON array like [\"A\", \"B\"]");
    }
    if (!questionText || !questionType || !correctAnswer) {
        if (req.file) fs.unlinkSync(req.file.path); // Faltu file delete karo
        throw new ApiError(400, "Sare fields (Text, Type, Answer, Options) mandatory hain");
    }

    const testWithSection = await Test.findOneAndUpdate({
        _id: testId,
        "sections.sectionName": { $ne: sectionName }
    },
        {
            $push: {
                sections: { sectionName, questions: [] }
            }
        }
        , { new: true }

    )
    let questionImageUrl = "";

    if (req.file?.path) {
        const uploadedImage = await uploadOnCloudinary(req.file.path);
        if (!uploadedImage) {
            throw new ApiError(400, "Image upload failed");
        }
        questionImageUrl = uploadedImage.url;
    }
    let parsedCorrectAnswer;
    try {
        parsedCorrectAnswer = typeof (correctAnswer) === "string" && correctAnswer.startsWith("[") ? JSON.parse(correctAnswer) : [correctAnswer]
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        throw new ApiError(400, "answer format is not correct")
    }
    const updateTest = await Test.findOneAndUpdate(
        {
            _id: testId,
            "sections.sectionName": sectionName
        },
        {
            $push: {
                "sections.$.questions": {//note dollar sign is used to mark the postion to find correctly and to make a refrence point to insert at the correct place
                    questionText,
                    questionType,
                    options: providedOptions,
                    correctAnswer: parsedCorrectAnswer,
                    marks,
                    negativeMarks,
                    questionImage: questionImageUrl,
                    topic,
                    difficulty
                }
            }
        },
        {
            new: true,
            select: "title _id"

        }
    )
    if (!updateTest) {
        throw new ApiError(404, "Test or Section not found");
    }
    return res.status(200).json(new ApiResponse(200, { questionText, sectionName, topic }, "Question successfully added"))
})
const getAllTests = asyncHandler(async (req, res) => {
    //we onely want the data to be displayed questions and sections ko hide rakhenge taki response fast rhe
    const tests = await Test.find()
        .select("-sections").sort("-createdAt");
    return res.status(200)
        .json(new ApiResponse(200, tests, "Test details fetched Successfully"))
});
const getTestById = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    validateTestId(testId);
    //in this also we exclude the questions ,only test infor will send
    const test = await Test.findById(testId).select("-sections");
    if (!test) {
        throw new ApiError(404, "Test not fount!")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, test, "test details fetched"))
})
const getTestQuestions = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    validateTestId(testId);
    //aggregation Pipeline starts
    const testWithQuestions = await Test.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(testId)//ye id string format me aata hai lekin mongodb me object id format me hota hai isliye hum usko convert karte hai taki match ho sake
            }
        },
        {
            //showing only the important data
            $project: {
                title: 1,
                duration: 1,
                totalMarks: 1,
                topic: 1,
                sections: {
                    $map: {
                        input: "$sections",
                        as: "section",
                        in: {
                            sectionName: "$$section.sectionName",
                            questions: {
                                $map: {
                                    input: "$$section.questions",//src
                                    as: "q",//nickname
                                    in: {//operations to be performed
                                        _id: "$$q._id",
                                        questionText: "$$q.questionText",
                                        questionType: "$$q.questionType",
                                        options: "$$q.options",
                                        marks: "$$q.marks",
                                        negativeMarks: "$$q.negativeMarks",
                                        // correctAnswer: "$$q.correctAnswer",
                                        topic: { $ifNull: ["$$q.topic", "general"] },
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ])
    if (!testWithQuestions || testWithQuestions.length === 0) {
        throw new ApiError(404, "Test not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, testWithQuestions[0], "Questions loaded (securely)"))
})
const updateTest = asyncHandler(async (req, res) => {
    const { testId } = req.params;
    const { title, description, duration, totalMarks, category } = req.body;
    
    // 1. Capture the local file path immediately so we can clean it up if anything fails
    const localFilePath = req.file?.path;

    try {
        validateTestId(testId);
        
        const test = await Test.findById(testId);
        if (!test) throw new ApiError(404, "Test not found");

        // Only the teacher who created it (or admin) can update it
        if (test.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            throw new ApiError(403, "You can only update your own tests");
        }

        // If title is being changed, check it doesn't conflict with another test by same teacher
        if (title && title !== test.title) {
            const conflict = await Test.findOne({ title, teacher: req.user._id });
            if (conflict) throw new ApiError(409, "You already have a test with this title");
            test.title = title;
        }

        // Update basic fields
        if (description !== undefined) test.description = description;
        if (duration) test.duration = Number(duration);
        if (totalMarks) test.totalMarks = Number(totalMarks);
        if (category) test.category = category;

        // Handle new thumbnail upload if provided
        if (localFilePath) {
            
            // [BETTER WAY]: Non-blocking deletion. 
            // If deleting the old image fails, don't crash the whole update process!
            if (test.thumbnail) {
                try {
                    await deleteFromCloudinary(test.thumbnail);
                } catch (cloudinaryErr) {
                    console.warn(`Could not delete old thumbnail for test ${testId}, proceeding anyway.`);
                }
            }

            const uploaded = await uploadOnCloudinary(localFilePath);
            if (!uploaded) throw new ApiError(500, "Thumbnail upload failed");
            
            test.thumbnail = uploaded.url;
        }

        await test.save();
        return res.status(200).json(new ApiResponse(200, test, "Test updated successfully"));

    } catch (error) {
        // [BETTER WAY]: The Storage Leak Fix!
        // If ANY error was thrown above (403, 409, 404, etc.), we must delete the file 
        // Multer left in the temp folder before passing the error to the global handler.
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        // Re-throw the error so asyncHandler can send the proper response to the frontend
        throw error; 
    }
});

// Ensure you export it at the bottom:
// export { ..., updateTest };

export {
    createTest, addQuestionToSection, getAllTests, getTestById, getTestQuestions
};