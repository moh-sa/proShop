import mongoose from "mongoose";
const mongoURL =
  "mongodb+srv://tno:tno123@cluster0.msbgcla.mongodb.net/?retryWrites=true&w=majority";

const options = { useNewUrlParser: true, useUnifiedTopology: true };

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURL, options);
    console.log(`mongodb connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
