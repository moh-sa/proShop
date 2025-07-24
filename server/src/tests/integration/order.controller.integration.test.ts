import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { OrderController } from "../../controllers";
import { NotFoundError } from "../../errors";
import Order from "../../models/orderModel";
import Product from "../../models/productModel";
import User from "../../models/userModel";
import {
  generateMockInsertOrder,
  generateMockObjectId,
  generateMockSelectOrder,
  generateMockSelectOrders,
  generateMockUser,
} from "../mocks";
import { createMockExpressContext } from "../utils";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("Order Controller 〖 Integration Tests 〗", () => {
  const controller = new OrderController();

  before(async () => await connectTestDatabase());
  after(async () => await disconnectTestDatabase());

  beforeEach(async () => {
    await Order.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
  });

  describe("create", () => {
    test("Should return success response when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockOrderData = generateMockInsertOrder();

      const { req, res, next } = createMockExpressContext();
      req.body = mockOrderData;
      res.locals.user = mockUser;

      // Act
      await controller.create(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '201' status code when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockOrderData = generateMockInsertOrder();

      const { req, res, next } = createMockExpressContext();
      req.body = mockOrderData;
      res.locals.user = mockUser;

      // Act
      await controller.create(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 201);
    });

    test("Should create order when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockOrderData = generateMockInsertOrder();

      const { req, res, next } = createMockExpressContext();
      req.body = mockOrderData;
      res.locals.user = mockUser;

      // Act
      await controller.create(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(response.data._id);
      assert.strictEqual(response.data.user, mockUser._id.toString());
      assert.strictEqual(
        response.data.orderItems.length,
        mockOrderData.orderItems.length,
      );
      assert.strictEqual(
        response.data.paymentMethod,
        mockOrderData.paymentMethod,
      );
      assert.strictEqual(response.data.totalPrice, mockOrderData.totalPrice);
    });

    test("Should include user ID in created order when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockOrderData = generateMockInsertOrder();

      const { req, res, next } = createMockExpressContext();
      req.body = mockOrderData;
      res.locals.user = mockUser;

      // Act
      await controller.create(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.user, mockUser._id.toString());
    });

    test("Should set 'PaymentMethod' to 'PayPal' if not provided when 'service.create' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { paymentMethod, ...mockOrderData } = generateMockInsertOrder();

      const { req, res, next } = createMockExpressContext();
      req.body = mockOrderData;
      res.locals.user = mockUser;

      // Act &
      await controller.create(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.paymentMethod, "PayPal");
    });

    test("Should throw 'ZodError' when 'service.create' is called without orderItems", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { orderItems, ...mockOrderData } = generateMockInsertOrder();

      const { req, res, next } = createMockExpressContext();
      req.body = mockOrderData;
      res.locals.user = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "orderItems");
          assert.strictEqual(error.errors[0].message, "Required");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.create' is called without shippingAddress", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { shippingAddress, ...mockOrderData } = generateMockInsertOrder();

      const { req, res, next } = createMockExpressContext();
      req.body = mockOrderData;
      res.locals.user = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "shippingAddress");
          assert.strictEqual(error.errors[0].message, "Required");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.create' is called with empty orderItems array", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockOrderData = generateMockInsertOrder({ orderItems: [] });

      const { req, res, next } = createMockExpressContext();
      req.body = mockOrderData;
      res.locals.user = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "orderItems");
          assert.strictEqual(
            error.errors[0].message,
            "Order items are required.",
          );
          return true;
        },
      );
    });
  });

  describe("getById", () => {
    test("Should return success response when 'service.getById' is called with valid data", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder();
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.getById' is called with valid data", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder();
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return order object when 'service.getById' is called with existing order", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder();
      await Order.insertMany([mockOrder]);
      const { req, res, next } = createMockExpressContext();

      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data._id, mockOrder._id.toString());
      assert.strictEqual(response.data.totalPrice, mockOrder.totalPrice);
      assert.strictEqual(response.data.paymentMethod, mockOrder.paymentMethod);
    });

    test("Should return order with correct user reference when 'service.getById' is called with existing order", async () => {
      // Arrange
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);

      const mockOrder = generateMockSelectOrder({ user: mockUser });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(response.data.user);
    });

    test("Should throw 'NotFoundError' when 'service.getById' is called with non-existent order id", async () => {
      // Arrange
      const orderId = generateMockObjectId();

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: orderId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getById(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Order not found");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.getById' is called with invalid 'objectId' in params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getById(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("getAll", () => {
    test("Should return success response when 'service.getAll' is called with valid data", async () => {
      // Arrange
      const mockOrders = generateMockSelectOrders(2);
      await Order.insertMany(mockOrders);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.getAll' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return array of orders when 'service.getAll' is called with existing orders", async () => {
      // Arrange
      const mockOrders = generateMockSelectOrders(2);
      await Order.insertMany(mockOrders);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(Array.isArray(response.data));
      assert.strictEqual(response.data.length, mockOrders.length);
    });

    test("Should return 'empty array' when 'service.getAll' is called with no orders in database", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 0);
    });
  });

  describe("getAllByUserId", () => {
    test("Should return success response when 'service.getAllByUserId' is called with valid data", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder();
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: mockOrder.user._id.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.getAllByUserId' is called with valid data", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder();
      const { req, res, next } = createMockExpressContext();

      req.params = { userId: mockOrder.user._id.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return array of orders for specific user when 'service.getAllByUserId' is called with existing orders", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockOrders = generateMockSelectOrders(3, { user: mockUser });
      const otherOrders = generateMockSelectOrders(2);
      await Order.insertMany([mockOrders, otherOrders].flat());

      const { req, res, next } = createMockExpressContext();

      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(Array.isArray(response.data));
      assert.strictEqual(response.data.length, 3);
    });

    test("Should return 'empty array' when 'service.getAllByUserId' is called with user who has no orders", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockOrders = generateMockSelectOrders(5);
      await Order.insertMany(mockOrders);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 0);
    });

    test("Should throw 'ZodError' when 'service.getAllByUserId' is called with invalid 'objectId' in params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { userId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getAllByUserId(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should not return orders from other users when 'service.getAllByUserId' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);

      const mockOrder1 = generateMockSelectOrder({ user: mockUser });
      const mockOrder2 = generateMockSelectOrder();
      await Order.insertMany([mockOrder1, mockOrder2]);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: mockOrder1.user._id.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 1);
      assert.strictEqual(
        response.data[0].user.toString(),
        mockOrder1.user._id.toString(),
      );
    });
  });

  describe("updateToPaid", () => {
    test("Should return success response when 'service.updateToPaid' is called with valid data", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder({ isPaid: true });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.updateToPaid(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.updateToPaid' is called with valid data", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder({ isPaid: false });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.updateToPaid(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should set 'isPaid' to true when 'service.updateToPaid' is called with existing order", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder({ isPaid: false });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.updateToPaid(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.isPaid, true);
    });

    test("Should set 'paidAt' timestamp when 'service.updateToPaid' is called with existing order", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder({
        isPaid: false,
        paidAt: undefined,
      });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.updateToPaid(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(response.data.paidAt);
      assert.ok(new Date(response.data.paidAt) < new Date());
    });

    test("Should throw 'NotFoundError' when 'service.updateToPaid' is called with non-existent order id", async () => {
      // Arrange
      const orderId = generateMockObjectId();
      const { req, res, next } = createMockExpressContext();

      req.params = { orderId: orderId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.updateToPaid(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Order not found");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.updateToPaid' is called with invalid 'objectId' in params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.updateToPaid(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("updateToDelivered", () => {
    test("Should return success response when 'service.updateToDelivered' is called with valid data", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder({ isDelivered: false });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.updateToDelivered(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.updateToDelivered' is called with valid data", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder({ isDelivered: false });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.updateToDelivered(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should set 'isDelivered' to true when 'service.updateToDelivered' is called with existing order", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder({ isDelivered: false });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.updateToDelivered(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.isDelivered, true);
    });

    test("Should set 'deliveredAt' timestamp when 'service.updateToDelivered' is called with existing order", async () => {
      // Arrange
      const mockOrder = generateMockSelectOrder({
        isDelivered: false,
        deliveredAt: undefined,
      });
      await Order.insertMany([mockOrder]);

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: mockOrder._id.toString() };

      // Act
      await controller.updateToDelivered(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(response.data.deliveredAt);
      assert.ok(new Date(response.data.deliveredAt) < new Date());
    });

    test("Should throw 'NotFoundError' when 'service.updateToDelivered' is called with non-existent order id", async () => {
      // Arrange
      const orderId = generateMockObjectId();

      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: orderId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.updateToDelivered(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Order not found");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.updateToDelivered' is called with invalid 'objectId' in params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { orderId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.updateToDelivered(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });
});
