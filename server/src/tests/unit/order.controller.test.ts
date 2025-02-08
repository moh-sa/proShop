import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { orderController } from "../../controllers";
import { EmptyCartError, NotFoundError } from "../../errors";
import Order from "../../models/orderModel";
import {
  generateMockOrder,
  generateMockOrders,
  generateMockUser,
} from "../mocks";
import { createMockExpressContext, dbClose, dbConnect } from "../utils";

const controller = orderController;

before(async () => await dbConnect());
after(async () => await dbClose());
beforeEach(async () => await Order.deleteMany({}));

suite("Order Controller", () => {
  describe("Create Order", () => {
    test("Should create new order and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockOrder = generateMockOrder();
      const mockUser = generateMockUser();

      res.locals.user = mockUser;
      req.body = mockOrder;

      await controller.create(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 201);
      assert.equal(data.totalPrice, mockOrder.totalPrice);
    });

    test("Should throw 'EmptyCartError' if 'orderItems' is empty", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockOrder = generateMockOrder();
      const mockUser = generateMockUser();

      mockOrder.orderItems = [];
      res.locals.user = mockUser;
      req.body = mockOrder;

      try {
        await controller.create(req, res, next);
      } catch (error) {
        assert.ok(error instanceof EmptyCartError);
        assert.equal(error.statusCode, 400);
      }
    });

    test("Should throw 'ZodError' if the 'order' data is invalid", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      res.locals.user = mockUser;
      try {
        await controller.create(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues[0].message, "Required");
      }
    });
  });

  describe("Retrieve Order By ID", () => {
    test("Should retrieve order by ID and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockOrder = generateMockOrder();

      const order = await Order.create(mockOrder);
      req.params.orderId = order._id.toString();

      await controller.getById(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.totalPrice, mockOrder.totalPrice);
    });

    test("Should throw 'NotFoundError' if order does not exist", async () => {
      const { req, res, next } = createMockExpressContext();

      req.params.orderId = generateMockOrder()._id.toString();

      try {
        await controller.getById(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.message, "Order not found");
        assert.equal(error.statusCode, 404);
      }
    });

    test("Should throw 'ZodError' if the 'orderId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.orderId = "RANDOM_STRING";

      try {
        await controller.getById(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Retrieve Orders", () => {
    test("Should retrieve all orders and return 200 with array of data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockOrders = generateMockOrders(4);

      await Order.insertMany(mockOrders);

      await controller.getAll(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 4);
    });

    test("Should return empty array if no orders exist", async () => {
      const { req, res, next } = createMockExpressContext();

      await controller.getAll(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 0);
    });
  });

  describe("Retrieve User's Orders", () => {
    test("Should retrieve all orders for a specific user and return 200 with array of data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockOrders = generateMockOrders(4);

      await Order.insertMany(mockOrders);
      req.params.userId = mockOrders[0].user.toString();

      await controller.getUser(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 1);
    });

    test("Should return empty array if no orders exist", async () => {
      const { req, res, next } = createMockExpressContext();

      req.params.userId = generateMockOrder().user.toString();

      await controller.getUser(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 0);
    });

    test("Should throw 'ZodError' if the 'userId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.userId = "RANDOM_STRING";

      try {
        await controller.getUser(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Update Order To Paid", () => {
    test("Should update the order to paid and return 200 with the updated data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockOrder = generateMockOrder();

      const order = await Order.create(mockOrder);
      req.params.orderId = order._id.toString();

      await controller.updateToPaid(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.ok(data.isPaid);
      assert.ok(data.paidAt);
    });

    test("Should throw 'NotFoundError' if order does not exist", async () => {
      const { req, res, next } = createMockExpressContext();

      req.params.orderId = generateMockOrder()._id.toString();

      try {
        await controller.updateToPaid(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Order not found");
      }
    });

    test("Should throw 'ZodError' if the 'orderId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.orderId = "RANDOM_STRING";

      try {
        await controller.updateToPaid(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Update Order To Delivered", () => {
    test("Should update the order to delivered and return 200 with the updated data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockOrder = generateMockOrder();

      const order = await Order.create(mockOrder);
      req.params.orderId = order._id.toString();

      await controller.updateToDelivered(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.ok(data.isDelivered);
      assert.ok(data.deliveredAt);
    });

    test("Should throw 'NotFoundError' if order does not exist", async () => {
      const { req, res, next } = createMockExpressContext();

      req.params.orderId = generateMockOrder()._id.toString();

      try {
        await controller.updateToDelivered(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Order not found");
      }
    });

    test("Should throw 'ZodError' if the 'orderId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.orderId = "RANDOM_STRING";

      try {
        await controller.updateToDelivered(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });
});
