import type { Server } from "node:http";

import mongoose from "mongoose";

import app from "./app.js";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/index.js";

const PORT = env.PORT || 5000;

async function startServer(): Promise<void> {
	logger.info({ port: PORT }, "Starting server...");

	try {
		await connectDB();
		logger.info("Database connected successfully");

		const server = app.listen(PORT, () => {
			logger.info({ port: PORT }, "Server started successfully");
		});

		// Shutdown server on error
		server.on("error", async (error: NodeJS.ErrnoException) => {
			if (error.code === "EADDRINUSE") {
				logger.error(
					{
						error,
						port: PORT,
					},
					"Port is already in use",
				);
			} else {
				logger.error(
					{
						error,
						port: PORT,
					},
					"Server error occurred",
				);
			}

			await gracefulShutdown(server, 1);
		});

		// Shutdown server on termination signals (CTRL+C, Close terminal)
		process.on("SIGTERM", () => {
			logger.info("SIGTERM signal received");
			gracefulShutdown(server, 0);
		});
		process.on("SIGINT", () => {
			logger.info("SIGINT signal received");
			gracefulShutdown(server, 0);
		});
	} catch (error) {
		logger.fatal({ error, port: PORT }, "Failed to start server");

		await mongoose.connection.close();
		logger.info("Database connection closed");

		process.exit(1); // eslint-disable-line n/no-process-exit
	}
}

//
async function gracefulShutdown(server: Server, code: number): Promise<void> {
	logger.info(
		{
			exitCode: code,
			reason: code === 0 ? "manual" : "error",
		},
		"Starting graceful shutdown...",
	);

	try {
		await new Promise<void>((resolve) =>
			server.close(() => {
				logger.info("Server connections closed");
				resolve();
			}),
		);

		await mongoose.connection.close();
		logger.info("Database connection closed");
	} catch (err) {
		logger.error({ err, exitCode: code }, "Error during graceful shutdown");
	} finally {
		process.exit(code); // eslint-disable-line n/no-process-exit
	}
}

startServer();
