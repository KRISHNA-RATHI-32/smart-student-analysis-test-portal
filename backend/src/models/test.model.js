import mongoose,{Schema} from "mongoose"
const questionSchema=new Schema({
    questionTest:{
        type:String,
        required:true,
    },
    questionImage:{
        type:String
    },
    questionType:{
        type:String,
        enum:["mcq","multi-select","one-word"],
        required:true,
    },
    options:[String],
    correctAnswer:[String],  
    marks:{
        type:Number,
        default:4
    },
    negativeMarks:{
        type:Number,
        default:0
    },
    
});
const testSchema=new Schema(
    {
        title:{
            type:String,
            required:true,
        },
        description:{
            type:String
        },
        teacher:{
            type:Schema.Types.ObjectId,
            ref:"User",
        },
        duration:{
            type:Number,required:true
        },
        sections:[{sectionName:String,
            questions:[questionSchema],
        }],
    },{timestamps:true}
);
export const Test=mongoose.model("Test",testSchema);