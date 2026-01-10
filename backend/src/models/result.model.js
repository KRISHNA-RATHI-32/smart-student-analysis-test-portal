import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const resultSchema=new Schema({
    student:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    test:{
        type:Schema.Types.ObjectId,
        ref:"Test",
    },
    score:{
        type:Number,
        required:true,
    },
    totalMarks:{
        type:Number,
    },
    answers:[{
        questionId:Schema.Types.ObjectId,
        submittedAnswer:[String],
        isCorrect:Boolean,
    },],
    timeTaken:{
        type:Number,
    },
},{timestamps:true});
resultSchema.plugin(mongooseAggregatePaginate);
export const Result=mongoose.model("Result",resultSchema);