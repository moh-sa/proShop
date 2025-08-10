import type { Types } from "mongoose";

import type { IOrderRepository } from "../repositories/index.js";
import type {
  AllOrdersResponse,
  InsertOrder,
  SelectOrder,
} from "../types/index.js";

import { EmptyCartError, NotFoundError } from "../errors/index.js";
import { OrderRepository } from "../repositories/index.js";

export interface IOrderService {
  create(data: InsertOrder): Promise<SelectOrder>;
  getAll(): Promise<AllOrdersResponse>;
  getAllByUserId(data: { userId: Types.ObjectId }): Promise<AllOrdersResponse>;
  getById(data: { orderId: Types.ObjectId }): Promise<SelectOrder>;
  updateToDelivered(data: { orderId: Types.ObjectId }): Promise<SelectOrder>;
  updateToPaid(data: { orderId: Types.ObjectId }): Promise<SelectOrder>;
}
export class OrderService implements IOrderService {
  private readonly _repository: IOrderRepository;

  constructor(repository: IOrderRepository = new OrderRepository()) {
    this._repository = repository;
  }

  async create(data: InsertOrder): Promise<SelectOrder> {
    if (data.orderItems && data.orderItems.length === 0) {
      throw new EmptyCartError();
    }

    return await this._repository.create(data);
  }

  async getAll(): Promise<AllOrdersResponse> {
    return await this._repository.getAll();
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<AllOrdersResponse> {
    return await this._repository.getAllByUserId({ userId });
  }

  async getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const order = await this._repository.getById({ orderId });
    if (!order) throw new NotFoundError("Order");

    return order;
  }

  async updateToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this._repository.updateToDelivered({
      orderId,
    });
    if (!updatedOrder) throw new NotFoundError("Order");

    return updatedOrder;
  }

  async updateToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this._repository.updateToPaid({ orderId });
    if (!updatedOrder) throw new NotFoundError("Order");

    return updatedOrder;
  }
}
