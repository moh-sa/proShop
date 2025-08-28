import type { Request, Response } from "express";

import * as Sentry from "@sentry/node";
import cors from "cors";
import express from "express";
import morgan from "morgan";

import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.middleware.js";
import routes from "./routes/index.js";

const app = express();

if (env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

connectDB();

app.use(express.json());
app.use(
	cors({
		origin: [env.CLIENT_URL],
	}),
);

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.send("API is running...");
});

app.use(routes);

app.get("/api/config/paypal", (_req: Request, res: Response) => {
	res.send(env.PAYPAL_CLIENT_ID);
});

app.use("/uploads", express.static("uploads"));

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

const PORT = env.PORT || 5000;
app.listen(PORT, () => {
	console.info(`Server running on port ${PORT}`);
});
