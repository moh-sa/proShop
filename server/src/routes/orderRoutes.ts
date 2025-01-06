import express from "express";
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderToDelivered,
  updateOrderToPaid,
} from "../controllers/orderController";
import { getUserByIdMW, isUserAdminMW, verifyTokenMW } from "../middlewares";
const router = express.Router();

router
  .route("/")
  .post(verifyTokenMW, getUserByIdMW, addOrderItems)
  .get(verifyTokenMW, getUserByIdMW, isUserAdminMW, getOrders);

router.route("/myorders").get(verifyTokenMW, getUserByIdMW, getMyOrders);

router.route("/:id").get(verifyTokenMW, getUserByIdMW, getOrderById);

router.route("/:id/pay").put(verifyTokenMW, getUserByIdMW, updateOrderToPaid);

router
  .route("/:id/deliver")
  .put(verifyTokenMW, getUserByIdMW, isUserAdminMW, updateOrderToDelivered);

export default router;
