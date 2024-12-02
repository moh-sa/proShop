import mongoose from "mongoose";

const options = { useNewUrlParser: true, useUnifiedTopology: true };

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, options);
    console.log(`mongodb connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
