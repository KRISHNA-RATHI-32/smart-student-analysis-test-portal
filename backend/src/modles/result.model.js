import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const resultSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
ref: "User",
    },
    test: {
        type: Schema.Types.ObjectId,
        ref: "Test",//here we only give the reference to the test, we don't need to embed the test details in the result schema because we can populate the test details when we need it using the reference
    },
    batch: {
        type: Schema.Types.ObjectId,
        ref: "Batch"
    },
    score: {
        type: Number,
        default:0,
    },
    totalMarks: {
        type: Number,
    },
    status: {
        type: String,
        enum: ["started", "completed"],
        default: "started"
    },
    answers: [{
        questionId: {
        type:Schema.Types.ObjectId,
        ref:"Question"
        },
        topic: String,
        submittedAnswer: [String],
        isCorrect: Boolean,
        timeSpent: { type: Number, default: 0 }
    },],
    timeTaken: {
        type: Number,
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    submittedAt: {
        type: Date
    }
}, { timestamps: true });
resultSchema.index({ student: 1, test: 1 }, { unique: true });
resultSchema.plugin(mongooseAggregatePaginate);
export const Result = mongoose.model("Result", resultSchema);