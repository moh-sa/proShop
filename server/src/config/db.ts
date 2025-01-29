import mongoose from "mongoose";
import { env } from "./env";

const options = { useNewUrlParser: true, useUnifiedTopology: true };

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.DB_URL);
    console.log(`mongodb connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof mongoose.Error) {
      console.error(`Error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${error}`);
    }
    process.exit(1);
  }
};

export default connectDB;
