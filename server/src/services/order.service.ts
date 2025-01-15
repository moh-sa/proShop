import { orderRepository } from "../repositories";
import { TInsertOrder, TSelectOrder } from "../types";

class OrderService {
  private readonly repository = orderRepository;

  async create(data: TInsertOrder): Promise<TSelectOrder> {
    if (data.orderItems && data.orderItems.length === 0) {
      throw new Error("No order items");
    }

    return await this.repository.createOrder({ orderData: data });
  }

  async getById({ orderId }: { orderId: string }): Promise<TSelectOrder> {
    const order = await this.repository.getOrderById({ orderId });
    if (!order) throw new Error("Order not found.");
    return order;
  }

  async getAll(): Promise<Array<TSelectOrder>> {
    return this.repository.getAllOrders();
  }

  async getUserOrders({
    userId,
  }: {
    userId: string;
  }): Promise<Array<TSelectOrder>> {
    return this.repository.getUserOrders({ userId });
  }

  async updateToPaid({ orderId }: { orderId: string }): Promise<TSelectOrder> {
    const updatedOrder = await this.repository.updateOrderToPaid({ orderId });
    if (!updatedOrder) throw new Error("Order not found.");
    return updatedOrder;
  }

  async updateToDelivered({
    orderId,
  }: {
    orderId: string;
  }): Promise<TSelectOrder> {
    const updatedOrder = await this.repository.updateOrderToDelivered({
      orderId,
    });
    if (!updatedOrder) throw new Error("Order not found.");
    return updatedOrder;
  }
}

export const orderService = new OrderService();
