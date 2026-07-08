import mongoose,{Schema} from "mongoose";

const batchSchema=new Schema({
  name:{type:String,required:true,trim:true,unique:true},
  discription:{
    type:String,
    default:""
  },
  year:{type:String,
    required:true,
  },
  students:[{type:Schema.Types.ObjectId,ref:"User"}],
  teachers:[{type:Schema.Types.ObjectId,ref:"User"}],
  isActive:{type:Boolean,default:true}
},{timestamps:true});

export const Batch=mongoose.model("Batch",batchSchema);
