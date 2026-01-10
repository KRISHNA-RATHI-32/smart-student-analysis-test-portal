import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Test} from "../models/test.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose"
import { Result } from "../models/result.model.js"
const createTest=asyncHandler(async(req ,res)=>{
    const {title,description,duration,totalMarks,category}=req.body;
    if([title,duration,totalMarks].some((field)=>field?.trim()=="")){
        throw new ApiError(400,"Title, Duration, and Total Marks are required");
    }
    const thumbnailLocalPath=req.file?.path;
     if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail image is required");
     }
     const thumbnail=await uploadOnCloudinary(thumbnalilLocalPath);
     if(!thumbnail){
        throw new ApiError(400,"Thumbnail upload failed");
     }
     const test=await Test.create({
        title,
        description,
        duration,
        totalMarks,
        category,
        thumbnail:thumbnail.url,
        createdBy:req.user._id
     })
     return res
            .status(201)
            .json(new ApiResponse(201,test,"Test created successfully"));
});
const addQuestionToSection=asyncHandler(async(req,res)=>{
    const {testId,sectionName}=req.params;
    
    const {
        questionText,
        questionType,
        options,
        correctAnswer,
        marks,
        negativeMarks
    }=req.body;
    if(!questionText||questionType||!correctAnswer){
        throw new ApiError(400,"all fields are mandatory");
    }
    
    let questionImageUrl = "";
 
    if(req.file?.path){
        const uploadedImage = await uploadOnCloudinary(req.file.path);
        if(!uploadedImage){
        throw new ApiError(400,"Image upload failed");
        }
        questionImageUrl = uploadedImage.url;
    }

    const updateTest=await Test.findOneAndUpdate(
        {_id:testId,
            "sections.sectionName":sectionName
        },
        {
            $push:{
                "sections.$.questions":{//note dollar sign is used to mark the postion to find correctly and to make a refrence point to insert at the correct place
                    questionText,
                    questionType,
                    options,
                    correctAnswer,
                    marks,
                    negativeMarks
                }
            }
        },
        {new:true}
    )
    if(!updateTest){
        throw new ApiError(404,"Test or Section not found");
    }
    return res.status(200).json(new ApiResponse(200,updateTest,"Question successfully added"))
})
const getAllTests=asyncHandler(async(req,res)=>{
    //we onely want the data to be displayed questions and sections ko hide rakhenge taki response fast rhe
    const tests=await Test.find()
    .select("-sections").sort("-createdAt");
    return res.status(200)
                .json(new ApiResponse(200,tests,"Test details fetched Successfully"))
});
const getTestById=asyncHandler(async(req,res)=>{
    const {testId}=req.params;
    //in this also we exclude the questions ,only test infor will send
    const test=await Test.findById(testId).select("-sections");
    if(!test){
        throw new ApiError(404,"Test not fount!")
    }
    return res  
        .status(200)
        .json(new ApiResponse(200,test,"test details fetched"))
})
const getTestQuestions=asyncHandler(async(req,res)=>{
    const {testId}=req.params;
    //aggregation Pipeline starts
    const testWithQuestions=await Test.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(testId)
            }
        },
        {
            //showing only the important data
            $project:{
                title:1,
                duration:1,
                totalMarks:1,
                sections:{
                    $map:{
                        input:"$sections",
                        as:"section",
                        in:{
                            sectionName:"$$section.sectionName",
                            questions:{
                                $map:{
                                    input:"$$section.questions",//src
                                    as:"q",//nickname
                                    in:{//operations to be performed
                                        _id:"$$q._id",
                                        questionText:"$$q.questionText",
                                        questionType:"$$q.questionType",
                                        options:"$$q.options",
                                        marks:"$$q.marks",
                                        negativeMarks:"$$q.negativeMarks"

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ])
    if(!testWithQuestions||testWithQuestions.length===0){
        throw new ApiError(404,"Test not found");
    }
    return res
            .status(200)
            .json(new ApiResponse(200,testWithQuestions[0],"Questions loaded (securely)"))
})


const submitTest=asyncHandler(async(req,res)=>{
    //matching the answers
    
    const {testId}=req.params;
    const {answers,timeTaken}=req.body;
    const test=await Test.findById(testId);
    if(!test)throw new ApiError(404,"Test not found");
    let finalScore=0;
    let TotalMarksCalculated=0;
    const processedAnswers=[];
    test.sections.forEach(section=>{
        section.questions.forEach(q=>{
            const studentAns=answers.find(a=>a.questionId===q._id.toString());
            let isCorrect=false;
            let currentSubmittedAnswer=[];
            if(studentAns){
                currentSubmittedAnswer=studentAns.selectedOption||[]
                const isCorrect=JSON.stringify(q.correctAnswer.sort())===JSON.stringify(studentAns.selectedOption.sort());
                if(isCorrect){
                    finalScore+=q.marks;
                }
                else{
                    finalScore-=q.negativeMarks;
                }
            }
                processedAnswers.push({
                    questionId:q._id,
                    submittedAnswer:currentSubmittedAnswer,
                    isCorrect:isCorrect
                })
                TotalMarksCalculated+=q.marks;
        })
    })
    //finaly save in db
    if(finalScore<0)finalScore=0;
    const result=await Result.create({
    student:req.user._id,
    test:testId,
    score:finalScore,
    totalMarks:TotalMarksCalculated,
    answers:processedAnswers,
    timeTaken:timeTaken||0
    
    })
    
    return res.status(200).json(new ApiResponse(200,result,"Test Submitted successfully!:"))
})
export{createTest,addQuestionToSection,getAllTests,getTestById,getTestQuestions,submitTest
};