import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

const app = express();

connectDB();

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

app.use(notFound);

app.use(errorHandler);

app.listen(process.env.PORT, console.log("server running on port 5000"));
