import cors from "cors";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import morgan from "morgan";
import path from "path";
import connectDB from "./config/db";
import { errorHandler, notFound } from "./middlewares/errorMiddleware";
import orderRoutes from "./routes/orderRoutes";
import productRoutes from "./routes/productRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import userRoutes from "./routes/userRoutes";
dotenv.config();

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

app.get("/api/config/paypal", (_req: Request, res: Response) => {
  res.send(process.env.PAYPAL_CLIENT_ID);
});

const __dirname = path.resolve();
app.use("/uploads", express.static("uploads"));

app.use(notFound);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
