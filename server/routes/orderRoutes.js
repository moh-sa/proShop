import express from "express";
const router = express.Router();
import { addOrderItems } from "../controllers/orderController.js";
import { protect } from "../middlewares/authMiddleware.js";

router.route("/profile").post(protect, addOrderItems);

export default router;
