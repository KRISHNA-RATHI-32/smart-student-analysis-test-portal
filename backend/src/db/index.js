import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB=async()=>{
    try{
        //mongoose gives us a returned object hence we can store it in a variable
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected!! DB HOST:${connectionInstance.connection.host}`)
    }
    catch(erro){
        console.log("MONGODB CONNECTION ERROR", erro);
        //node js gives access to process it is the refrence to the proces which is 
        process.exit(1)
    }
} 
export default connectDB//we have used this in 
