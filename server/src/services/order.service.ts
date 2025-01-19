import { Types } from "mongoose";
import { orderRepository } from "../repositories";
import { InsertOrder, SelectOrder } from "../types";

class OrderService {
  private readonly repository = orderRepository;

  async create(data: InsertOrder): Promise<SelectOrder> {
    if (data.orderItems && data.orderItems.length === 0) {
      throw new Error("No order items");
    }

    return await this.repository.createOrder({ orderData: data });
  }

  async getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const order = await this.repository.getOrderById({ orderId });
    if (!order) throw new Error("Order not found.");
    return order;
  }

  async getAll(): Promise<Array<SelectOrder>> {
    return this.repository.getAllOrders();
  }

  async getUserOrders({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectOrder>> {
    return this.repository.getUserOrders({ userId });
  }

  async updateToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this.repository.updateOrderToPaid({ orderId });
    if (!updatedOrder) throw new Error("Order not found.");
    return updatedOrder;
  }

  async updateToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this.repository.updateOrderToDelivered({
      orderId,
    });
    if (!updatedOrder) throw new Error("Order not found.");
    return updatedOrder;
  }
}

export const orderService = new OrderService();
