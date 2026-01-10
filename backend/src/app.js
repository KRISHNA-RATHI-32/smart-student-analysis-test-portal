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
import userRouter from "./routes/user.routes.js"
import testRouter from "./routes/test.routes.js"
app.use("/api/v1/users",userRouter)
app.user("/api/v1/tests",testRouter);
   
export default app;//to export we will se this in file namesd index.js
