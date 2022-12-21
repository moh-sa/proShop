import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";

/**
 * @description Create new order
 * @route POST /api/order
 * @access private
 */
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  } else {
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });
    const createdorder = await order.save();

    res.status(201).json(createdorder);
  }
});

export { addOrderItems };
