import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()
app.use( cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use("/api/v1/users",userRouter)
app.use("/api/v1/tests",testRouter);
app.use("/api/v1/results",resultRouter);
import testRouter from "./routes/test.routes.js"
import userRouter from "./routes/user.routes.js";
import resultRouter from "./routes/result.routes.js"

   
export default app;//to export we will se this in file namesd index.js
