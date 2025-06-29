import { Types } from "mongoose";
import { EmptyCartError, NotFoundError } from "../errors";
import { IOrderRepository, OrderRepository } from "../repositories";
import { InsertOrder, SelectOrder } from "../types";

export interface IOrderService {
  create(data: InsertOrder): Promise<SelectOrder>;
  getById(data: { orderId: Types.ObjectId }): Promise<SelectOrder>;
  getAll(): Promise<Array<SelectOrder>>;
  getAllByUserId(data: { userId: Types.ObjectId }): Promise<Array<SelectOrder>>;
  updateToPaid(data: { orderId: Types.ObjectId }): Promise<SelectOrder>;
  updateToDelivered(data: { orderId: Types.ObjectId }): Promise<SelectOrder>;
}
export class OrderService implements IOrderService {
  private readonly repository: IOrderRepository;

  constructor(repository: IOrderRepository = new OrderRepository()) {
    this.repository = repository;
  }

  async create(data: InsertOrder): Promise<SelectOrder> {
    if (data.orderItems && data.orderItems.length === 0) {
      throw new EmptyCartError();
    }

    return await this.repository.create(data);
  }

  async getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const order = await this.repository.getById({ orderId });
    if (!order) throw new NotFoundError("Order");

    return order;
  }

  async getAll(): Promise<Array<SelectOrder>> {
    return await this.repository.getAll();
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectOrder>> {
    return await this.repository.getAllByUserId({ userId });
  }

  async updateToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this.repository.updateToPaid({ orderId });
    if (!updatedOrder) throw new NotFoundError("Order");

    return updatedOrder;
  }

  async updateToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this.repository.updateToDelivered({
      orderId,
    });
    if (!updatedOrder) throw new NotFoundError("Order");

    return updatedOrder;
  }
}
