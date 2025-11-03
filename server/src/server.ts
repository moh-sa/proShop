import type { Server } from "http";

import mongoose from "mongoose";

import app from "./app.js";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";

const PORT = env.PORT || 5000;

async function startServer(): Promise<void> {
	try {
		await connectDB();

		const server = app.listen(PORT, () => {
			console.info(`Server running on port ${PORT}`);
		});

		// Shutdown server on error
		server.on("error", async (error: NodeJS.ErrnoException) => {
			if (error.code === "EADDRINUSE") {
				console.error(`Port ${PORT} is already in use`);
			} else {
				console.error("Server error:", error);
			}

			await gracefulShutdown(server, 1);
		});

		// Shutdown server on termination signals (CTRL+C, Close terminal)
		process.on("SIGTERM", () => gracefulShutdown(server, 0));
		process.on("SIGINT", () => gracefulShutdown(server, 0));
	} catch (error) {
		console.error("Failed to start server:", error);
		await mongoose.connection.close();
		process.exit(1); // eslint-disable-line n/no-process-exit
	}
}

//
async function gracefulShutdown(server: Server, code: number): Promise<void> {
	console.info("Shutting down gracefully...");

	try {
		await new Promise<void>((resolve) => server.close(() => resolve()));
		await mongoose.connection.close();
		console.info("Database and server connections closed.");
	} catch (err) {
		console.error("Error during shutdown:", err);
	} finally {
		process.exit(code); // eslint-disable-line n/no-process-exit
	}
}

startServer();
