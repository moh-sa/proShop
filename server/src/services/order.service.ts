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

  async getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const order = await this._repository.getById({ orderId });
    if (!order) throw new NotFoundError("Order");

    return order;
  }

  async getAll(): Promise<Array<SelectOrder>> {
    return await this._repository.getAll();
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectOrder>> {
    return await this._repository.getAllByUserId({ userId });
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
}
