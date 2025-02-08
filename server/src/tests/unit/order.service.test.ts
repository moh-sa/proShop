import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { EmptyCartError, NotFoundError } from "../../errors";
import Order from "../../models/orderModel";
import { orderService } from "../../services";
import {
  generateMockObjectId,
  generateMockOrder,
  generateMockOrders,
} from "../mocks";
import { dbClose, dbConnect } from "../utils";

const service = orderService;
before(async () => await dbConnect());
after(async () => await dbClose());
beforeEach(async () => await Order.deleteMany({}));

suite("Order Service", () => {
  describe("Create Order", () => {
    test("Should create new product and return the data", async () => {
      const mockOrder = generateMockOrder();

      const order = await service.create(mockOrder);

      assert.ok(order);
      assert.equal(order.totalPrice, mockOrder.totalPrice);
      assert.equal(order.user._id, mockOrder.user);
    });

    test("Should throw 'EmptyCartError' if 'orderItems' is empty", async () => {
      const mockOrder = generateMockOrder();
      mockOrder.orderItems = [];

      try {
        await service.create(mockOrder);
      } catch (error) {
        assert.ok(error instanceof EmptyCartError);
        assert.equal(error.statusCode, 400);
      }
    });
  });

  describe("Retrieve Order By ID", () => {
    test("Should retrieve a order by ID", async () => {
      const mockOrder = generateMockOrder();

      const created = await Order.create(mockOrder);

      const order = await service.getById({ orderId: created._id });

      assert.ok(order);
      assert.equal(order.totalPrice, created.totalPrice);
    });

    test("Should throw 'NotFoundError' if order does not exist", async () => {
      try {
        await service.getById({ orderId: generateMockObjectId() });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
      }
    });
  });

  describe("Retrieve Orders", () => {
    test("Should retrieve all orders", async () => {
      const mockOrders = generateMockOrders(4);

      await Order.insertMany(mockOrders);

      const orders = await service.getAll();

      assert.ok(orders);
      assert.equal(orders.length, 4);
    });

    test("Should return an empty array if no orders exist", async () => {
      const orders = await service.getAll();

      assert.ok(orders);
      assert.equal(orders.length, 0);
    });
  });

  describe("Retrieve User's Orders", () => {
    test("Should retrieve all orders for a specific user", async () => {
      const mockOrders = generateMockOrders(4);

      await Order.insertMany(mockOrders);

      const orders = await service.getUserOrders({
        userId: mockOrders[0].user,
      });

      assert.ok(orders);
      assert.equal(orders.length, 1);
      assert.equal(orders[0].totalPrice, mockOrders[0].totalPrice);
    });

    test("Should return an empty array if no orders exist", async () => {
      const orders = await service.getUserOrders({
        userId: generateMockObjectId(),
      });

      assert.ok(orders);
      assert.equal(orders.length, 0);
    });
  });

  describe("Update Order To Paid", () => {
    test("Should update the isPaid and paidAt fields and return the updated order", async () => {
      const mockOrder = generateMockOrder();

      const created = await Order.create(mockOrder);

      const updatedOrder = await service.updateToPaid({
        orderId: created._id,
      });

      assert.ok(updatedOrder);
      assert.ok(updatedOrder.isPaid);
      assert.ok(updatedOrder.paidAt);
      assert.ok(new Date() > updatedOrder.paidAt);
    });

    test("Should throw 'NotFoundError' if order does not exist", async () => {
      try {
        await service.updateToPaid({
          orderId: generateMockObjectId(),
        });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
      }
    });
  });

  describe("Update Order To Delivered", () => {
    test("Should update the isDelivered and deliveredAt fields and return the updated order", async () => {
      const mockOrder = generateMockOrder();

      const created = await Order.create(mockOrder);

      const updatedOrder = await service.updateToDelivered({
        orderId: created._id,
      });

      assert.ok(updatedOrder);
      assert.ok(updatedOrder.isDelivered);
      assert.ok(updatedOrder.deliveredAt);
      assert.ok(new Date() > updatedOrder.deliveredAt);
    });

    test("Should throw 'NotFoundError' if order does not exist", async () => {
      try {
        await service.updateToDelivered({
          orderId: generateMockObjectId(),
        });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
      }
    });
  });
});
