import mongoose from "mongoose";

import { env } from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.DB_URL);
    console.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof mongoose.Error) {
      console.error(`Error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${String(error)}`);
    }
    process.exit(1); // eslint-disable-line n/no-process-exit
  }
};

export default connectDB;
