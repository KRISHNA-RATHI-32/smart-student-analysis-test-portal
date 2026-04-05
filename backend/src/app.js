import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js";
import testRouter from "./routes/test.routes.js"
import resultRouter from "./routes/result.routes.js"
import adminRouter from "./routes/admin.routes.js"

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN === "*" ? true : (process.env.CORS_ORIGIN || true),
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", userRouter)
app.use("/api/v1/tests", testRouter);
app.use("/api/v1/results", resultRouter);
app.use("/api/v1/admin", adminRouter);

// Global error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(statusCode).json({
        statusCode,
        data: null,
        message,
        success: false,
        errors: err.errors || []
    });
});

export default app;
