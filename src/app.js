import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import notFoundHandler from "./shared/middleware/notFound.js";
import globalErrorHandler from "./shared/errors/globalErrorHandler.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cookieParser());

//* 404 Handler
app.use(notFoundHandler);

//* Error Handler
app.use(globalErrorHandler);

export default app;
