import { Types } from "mongoose";
import Order from "../models/orderModel";
import { InsertOrder, SelectOrder } from "../types";

class OrderRepository {
  async createOrder({
    orderData,
  }: {
    orderData: InsertOrder;
  }): Promise<SelectOrder> {
    return Order.create(orderData);
  }

  async getOrderById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    return Order.findById(orderId).populate("user", "name email");
  }

  async updateOrderToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    return Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          isDelivered: true,
          deliveredAt: new Date(),
        },
      },
      { new: true },
    );
  }

  async updateOrderToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    return Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          isPaid: true,
          paidAt: new Date(),
        },
      },
      {
        new: true,
      },
    );
  }

  async getAll(userId?: Types.ObjectId): Promise<Array<SelectOrder>> {
    const options = userId ? { user: userId } : {};
    return Order.find(options).select(
      "id createdAt isPaid paidAt isDelivered deliveredAt totalPrice",
    );
  }
}

export const orderRepository = new OrderRepository();
