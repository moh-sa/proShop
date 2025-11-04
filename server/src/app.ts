import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import { httpLogger } from "./middlewares/http-logger.middleware.js";
import routes from "./routes/index.js";

const app = express();

// Security middlewares
app.use(
	cors({
		credentials: true,
		origin: [env.CLIENT_URL],
	}),
);

// Request parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET, { decode: decodeURIComponent }));

// Logging middlewares
app.use(httpLogger);

// Routes
app.get("/", (_req, res) => res.send("API is running..."));
app.use(routes);

// Error handling middleware must be last
app.use(errorHandler);

export default app;
