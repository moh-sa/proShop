import Order from "../models/orderModel";
import { TInsertOrder, TSelectOrder } from "../types";

class OrderRepository {
  async createOrder({
    orderData,
  }: {
    orderData: TInsertOrder;
  }): Promise<TSelectOrder> {
    return Order.create(orderData);
  }

  async getOrderById({
    orderId,
  }: {
    orderId: string;
  }): Promise<TSelectOrder | null> {
    return Order.findById(orderId);
  }

  async updateOrderToDelivered({
    orderId,
  }: {
    orderId: string;
  }): Promise<TSelectOrder | null> {
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
    orderId: string;
  }): Promise<TSelectOrder | null> {
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

  async getUserOrders({
    userId,
  }: {
    userId: string;
  }): Promise<Array<TSelectOrder>> {
    return Order.find({ user: userId }).populate("user", "name email");
  }

  async getAllOrders(): Promise<Array<TSelectOrder>> {
    return Order.find({}).populate("user", "id name");
  }
}

export const orderRepository = new OrderRepository();
