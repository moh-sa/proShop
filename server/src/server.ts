import * as dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import orderRoutes from "./routes/orderRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { notFound, errorHandler } from "./middlewares/errorMiddleware";

const app = express();
const clientURL =
  process.env.NODE_ENV === "development"
    ? process.env.CLIENT_URL_DEV
    : process.env.CLIENT_URL;

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

connectDB();

app.use(express.json());
app.use(cors({ origin: ["http://localhost:3000", "https://proshop.moh-sa.dev", "https://proshop.tno.dev"] }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/config/paypal", (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
);

const __dirname = path.resolve();
app.use("/uploads", express.static("uploads"));

app.use(notFound);

app.use(errorHandler);

app.listen(process.env.PORT, console.log("server running on port 5000"));
