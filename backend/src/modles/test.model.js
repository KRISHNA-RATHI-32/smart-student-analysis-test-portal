import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema({
    questionText: {
        type: String,
        required: true
    },
    questionImage: String,
    questionType: {
        type: String,
        enum: ["mcq", "multi-select", "one-word"],
        required: true
    },
    topic: String,
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium"
    },
    options: [String],
    correctAnswer: [String],
    marks: { type: Number, default: 4 },
    negativeMarks: { type: Number, default: 0 }
});

const testSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    teacher: { type: Schema.Types.ObjectId, ref: "User" },//teacher is the one who creates the test
    duration: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    category: { type: String, default: "general" },//it is just for the filtering purpose 
    batch: { type: Schema.Types.ObjectId, ref: "Batch" },//batch is the 
    sections: [{
        sectionName: String,
        questions: [questionSchema]
    }],
    thumbnail:{type:String}
}, { timestamps: true });

export const Test = mongoose.model("Test", testSchema);
