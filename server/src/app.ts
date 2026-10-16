import cookieParser from "cookie-parser";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";

import { addLoggerToContext } from "./middlewares/add-logger-to-context.middleware.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import { httpLogger } from "./middlewares/http-logger.middleware.js";
import { requestId } from "./middlewares/request-id.middleware.js";
import { verifySameOrigin } from "./middlewares/verify-same-origin.middleware.js";
import routes from "./routes/index.js";

const app = express();

// Traefik and Docker networking sit in front of Express; see `getClientIp`
app.set("trust proxy", "loopback, uniquelocal");

// Security middlewares - no CORS: the app and the API share one origin
app.use(helmet());
app.use(mongoSanitize({}));

// webhooks - MUST be before request parsing middlewares
app.use("/api/v1/webhooks/*", express.raw({ type: "application/json" }));

// Request parsing middlewares
app.use(express.json());
app.use(cookieParser(undefined, { decode: decodeURIComponent }));

// Logging middlewares
app.use(requestId);
app.use(addLoggerToContext);
app.use(httpLogger);

// CSRF protection - webhooks are server-to-server calls, so they are skipped
app.use((req, res, next) =>
	req.path.startsWith("/api/v1/webhooks/")
		? next()
		: verifySameOrigin(req, res, next),
);

// Routes
app.get("/", (_req, res) => res.send("API is running..."));
app.use(routes);

// Error handling middleware must be last
app.use(errorHandler);

export default app;
