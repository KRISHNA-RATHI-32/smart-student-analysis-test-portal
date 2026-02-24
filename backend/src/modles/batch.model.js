import mongoose,{Schema} from "mongoose";

const batchSchema=new Schema({
  name:String,
  year:String,
  students:[{type:Schema.Types.ObjectId,ref:"User"}],
  teachers:[{type:Schema.Types.ObjectId,ref:"User"}]
},{timestamps:true});

export const Batch=mongoose.model("Batch",batchSchema);
