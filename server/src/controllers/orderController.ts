import asyncHandler from "express-async-handler";
import Order from "../models/orderModel";
import { handleErrorResponse, isExist } from "../utils";

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
      user: res.locals.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });
    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
});

/**
 * @description Get  order by id
 * @route GET /api/order/:id
 * @access private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email",
  );
  if (!isExist(order)) return handleErrorResponse(res, 404, "Order not found");

  res.json(order);
});
/**
 * @description Update order to paid
 * @route PUT /api/order/:id/pay
 * @access private
 */
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!isExist(order)) return handleErrorResponse(res, 404, "Order not found");

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer.email_address,
  };

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

/**
 * @description Get logged in user orders
 * @route GET /api/order/myorders
 * @access private
 */
const getMyOrders = asyncHandler(async (_, res) => {
  const orders = await Order.find({ user: res.locals.user._id });
  res.json(orders);
});

/**
 * @description Get all order
 * @route GET /api/order/orders
 * @access private/admin
 */
const getOrders = asyncHandler(async (_, res) => {
  const orders = await Order.find({}).populate("user", "id name");
  res.json(orders);
});

/**
 * @description Update order to paid
 * @route PUT /api/order/:id/deliver
 * @access private/admin
 */
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!isExist(order)) return handleErrorResponse(res, 404, "Order not found");

  order.isDelivered = true;
  order.deliveredAt = new Date();

  const updatedOrder = await order.save();

  res.json(updatedOrder);
});

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderToDelivered,
  updateOrderToPaid,
};
