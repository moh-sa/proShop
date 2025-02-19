import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { DatabaseError } from "../../errors";
import Order from "../../models/orderModel";
import { orderRepository } from "../../repositories";
import {
  generateMockObjectId,
  generateMockOrder,
  generateMockOrders,
} from "../mocks";
import { dbClose, dbConnect } from "../utils";

const repo = orderRepository;

before(async () => await dbConnect());
after(async () => await dbClose());

beforeEach(async () => await Order.deleteMany({}));

suite("Order Repository", () => {
  describe("Create Order", () => {
    test("Should create new order in the database", async () => {
      const mockOrder = generateMockOrder();

      const order = await repo.createOrder({
        orderData: mockOrder,
      });

      assert.ok(order);
      assert.equal(order.totalPrice, mockOrder.totalPrice);
      assert.equal(order.user._id.toString(), mockOrder.user.toString());
    });

    test("Should throw 'DatabaseError' if userId is not a valid ObjectId", async () => {
      const mockOrder = generateMockOrder();

      try {
        await repo.createOrder({
          orderData: {
            ...mockOrder,
            // @ts-expect-error - testing invalid userId
            user: "invalid-user-id",
          },
        });
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.statusCode, 500);
      }
    });
  });

  describe("Retrieve Order By Id", () => {
    test("Should retrieve a order by id", async () => {
      const mockOrder = generateMockOrder();

      const created = await Order.create(mockOrder);

      const order = await repo.getOrderById({ orderId: created._id });

      assert.ok(order);
      assert.equal(order.totalPrice, created.totalPrice);
    });

    test("Should return 'null' if order does not exist", async () => {
      const order = await repo.getOrderById({
        orderId: generateMockObjectId(),
      });
      assert.equal(order, null);
    });
  });

  describe("Retrieve Orders", () => {
    test("Should retrieve all orders", async () => {
      const mockOrders = generateMockOrders(4);

      await Order.insertMany(mockOrders);

      const orders = await repo.getAll();
      assert.ok(orders);
      assert.equal(orders.length, 4);
    });

    test("Should retrieve orders for a specific user", async () => {
      const mockOrders = generateMockOrders(4);

      await Order.insertMany(mockOrders);

      const orders = await repo.getAll(mockOrders[0].user);

      assert.ok(orders);
      assert.equal(orders.length, 1);
      assert.equal(orders[0].totalPrice, mockOrders[0].totalPrice);
    });

    test("Should return an empty array if no orders exist", async () => {
      const orders = await repo.getAll();

      assert.ok(orders);
      assert.equal(orders.length, 0);
    });
  });

  describe("Update Order To Paid", () => {
    test("Should update the isPaid and paidAt fields and return the updated order", async () => {
      const mockOrder = generateMockOrder();

      const created = await Order.create(mockOrder);

      const updatedOrder = await repo.updateOrderToPaid({
        orderId: created._id,
      });

      assert.ok(updatedOrder);
      assert.ok(updatedOrder.isPaid);
      assert.ok(updatedOrder.paidAt);
      assert.ok(new Date() > updatedOrder.paidAt);
    });

    test("Should return 'null' if order does not exist", async () => {
      const order = await repo.updateOrderToPaid({
        orderId: generateMockObjectId(),
      });
      assert.equal(order, null);
    });
  });

  describe("Update Order To Delivered", () => {
    test("Should update the isDelivered and deliveredAt fields and return the updated order", async () => {
      const mockOrder = generateMockOrder();

      const created = await Order.create(mockOrder);

      const updatedOrder = await repo.updateOrderToDelivered({
        orderId: created._id,
      });

      assert.ok(updatedOrder);
      assert.ok(updatedOrder.isDelivered);
      assert.ok(updatedOrder.deliveredAt);
      assert.ok(new Date() > updatedOrder.deliveredAt);
    });

    test("Should return 'null' if order does not exist", async () => {
      const order = await repo.updateOrderToDelivered({
        orderId: generateMockObjectId(),
      });
      assert.equal(order, null);
    });
  });
});
