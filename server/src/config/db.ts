import mongoose from "mongoose";

import { logger } from "../utils/logger.util.js";
import { env } from "./env.js";

const connectDB = async () => {
	try {
		mongoose.set("strictQuery", true);
		const conn = await mongoose.connect(env.DB_URL);
		logger.info(
			{
				database: conn.connection.name,
				host: conn.connection.host,
			},
			"Database connection established",
		);
	} catch (error) {
		logger.fatal(error, "Failed to connect to database");
		throw error;
	}
};

export default connectDB;
