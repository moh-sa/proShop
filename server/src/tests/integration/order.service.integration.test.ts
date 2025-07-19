import { Types } from "mongoose";
import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import {
  DatabaseValidationError,
  EmptyCartError,
  NotFoundError,
} from "../../errors";
import Order from "../../models/orderModel";
import User from "../../models/userModel";
import { OrderService } from "../../services";
import { generateMockObjectId } from "../mocks/objectid.mock";
import {
  generateMockInsertOrder,
  generateMockInsertOrders,
} from "../mocks/order.mock";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("OrderService 〖 Integration Tests 〗", async () => {
  let orderService: OrderService;

  before(async () => await connectTestDatabase());
  after(async () => await disconnectTestDatabase());

  beforeEach(async () => {
    orderService = new OrderService();
    await Order.deleteMany({});
    await User.deleteMany({});
  });

  describe("create", async () => {
    test("Should create and return order object when 'repo.create' is called with '1' order item", async () => {
      // Arrange
      const orderItemsCount = 1;
      const mockOrder = generateMockInsertOrder({ orderItemsCount });

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.ok(result);
      assert.strictEqual(result.orderItems.length, orderItemsCount);
      assert.strictEqual(result.totalPrice, mockOrder.totalPrice);
    });

    test("Should create and return order object when 'repo.create' is called with '3' order items", async () => {
      // Arrange
      const orderItemsCount = 3;
      const mockOrder = generateMockInsertOrder({ orderItemsCount });

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.ok(result);
      assert.strictEqual(result.orderItems.length, orderItemsCount);
      assert.strictEqual(result.totalPrice, mockOrder.totalPrice);
    });

    test("Should throw 'EmptyCartError' when 'repo.create' is called with empty array of order items", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder();
      mockOrder.orderItems = [];

      // Act & Assert
      await assert.rejects(
        async () => await orderService.create(mockOrder),
        EmptyCartError,
      );
    });

    test("Should create and return order object when 'repo.create' is called with shipping address", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder();
      const expectedAddress = mockOrder.shippingAddress;

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.deepStrictEqual(result.shippingAddress, expectedAddress);
    });

    test("Should create and return order object when 'repo.create' is called with payment method", async () => {
      // Arrange
      const paymentMethod = "PayPal";
      const mockOrder = generateMockInsertOrder({ paymentMethod });

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.strictEqual(result.paymentMethod, paymentMethod);
    });

    test("Should create and return order object when 'repo.create' is called with tax price", async () => {
      // Arrange
      const taxPrice = 10.99;
      const mockOrder = generateMockInsertOrder({ taxPrice });

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.strictEqual(result.taxPrice, taxPrice);
    });

    test("Should create and return order object when 'repo.create' is called with shipping price", async () => {
      // Arrange
      const shippingPrice = 5.99;
      const mockOrder = generateMockInsertOrder({ shippingPrice });

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.strictEqual(result.shippingPrice, shippingPrice);
    });

    test("Should create and return order object when 'repo.create' is called with total price", async () => {
      // Arrange
      const itemsPrice = 100;
      const taxPrice = 20;
      const shippingPrice = 10;
      const totalPrice = 130;
      const mockOrder = generateMockInsertOrder({
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.strictEqual(result.itemsPrice, itemsPrice);
      assert.strictEqual(result.taxPrice, taxPrice);
      assert.strictEqual(result.shippingPrice, shippingPrice);
      assert.strictEqual(result.totalPrice, totalPrice);
    });

    test("Should create and return order object when 'repo.create' is called with isPaid false by default", async () => {
      // Arrange
      const isPaid = false;
      const mockOrder = generateMockInsertOrder({ isPaid });

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.strictEqual(result.isPaid, isPaid);
      assert.strictEqual(result.paidAt, undefined);
    });

    test("Should create and return order object when 'repo.create' is called with isDelivered false by default", async () => {
      // Arrange
      const isDelivered = false;
      const mockOrder = generateMockInsertOrder({ isDelivered });

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.strictEqual(result.isDelivered, isDelivered);
      assert.strictEqual(result.deliveredAt, undefined);
    });

    test("Should create and return order object when 'repo.create' is called with current timestamp as createdAt", async () => {
      // Arrange
      const beforeCreate = new Date();
      const mockOrder = generateMockInsertOrder();

      // Act
      const result = await orderService.create(mockOrder);

      // Assert
      assert.ok(result.createdAt instanceof Date);
      assert.ok(result.createdAt >= beforeCreate);
      assert.ok(result.createdAt <= new Date());
    });
  });

  describe("getById", async () => {
    test("Should return order object by its ID when 'repo.getById' is called with existing order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder();
      const createdOrder = await Order.create(mockOrder);

      // Act
      const result = await orderService.getById({
        orderId: createdOrder._id,
      });

      // Assert
      assert.ok(result);
      assert.deepStrictEqual(result._id, createdOrder._id);
      assert.strictEqual(result.totalPrice, createdOrder.totalPrice);
    });

    test("Should return order object with 3 order items when 'repo.getById' is called with existing order ID", async () => {
      // Arrange
      const orderItemsCount = 3;
      const mockOrder = generateMockInsertOrder({ orderItemsCount });
      const createdOrder = await Order.create(mockOrder);

      // Act
      const result = await orderService.getById({
        orderId: createdOrder._id,
      });

      // Assert
      assert.strictEqual(result.orderItems.length, orderItemsCount);
      result.orderItems.forEach((item, index) => {
        assert.strictEqual(item.price, createdOrder.orderItems[index].price);
        assert.strictEqual(item.qty, createdOrder.orderItems[index].qty);
        assert.strictEqual(item.name, createdOrder.orderItems[index].name);
      });
    });

    test("Should return order object with shipping address when 'repo.getById' is called with existing order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder();
      const createdOrder = (await Order.create(mockOrder)).toObject();

      // Act
      const result = await orderService.getById({
        orderId: createdOrder._id,
      });

      // Assert
      assert.deepStrictEqual(
        result.shippingAddress,
        createdOrder.shippingAddress,
      );
    });

    test("Should return order object with payment details when 'repo.getById' is called with existing order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder({ isPaid: true });
      const createdOrder = (await Order.create(mockOrder)).toObject();

      // Act
      const result = await orderService.getById({
        orderId: createdOrder._id,
      });

      // Assert
      assert.strictEqual(result.isPaid, true);
      assert.deepStrictEqual(result.paymentResult, createdOrder.paymentResult);
    });

    test("Should return order object with delivery status when 'repo.getById' is called with existing order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder({ isDelivered: true });
      const createdOrder = (await Order.create(mockOrder)).toObject();

      // Act
      const result = await orderService.getById({
        orderId: createdOrder._id,
      });

      // Assert
      assert.strictEqual(result.isDelivered, true);
      assert.ok(result.deliveredAt instanceof Date);
    });

    test("Should return order object with payment status when 'repo.getById' is called with existing order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder({ isPaid: true });
      const createdOrder = (await Order.create(mockOrder)).toObject();

      // Act
      const result = await orderService.getById({
        orderId: createdOrder._id,
      });

      // Assert
      assert.strictEqual(result.isPaid, true);
      assert.ok(result.paidAt instanceof Date);
    });

    test("Should return order object with timestamps when 'repo.getById' is called with existing order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder();
      const createdOrder = (await Order.create(mockOrder)).toObject();

      // Act
      const result = await orderService.getById({
        orderId: createdOrder._id,
      });

      // Assert
      assert.ok(result.createdAt instanceof Date);
      assert.ok(result.updatedAt instanceof Date);
    });

    test("Should throw 'NotFoundError' when 'repo.getById' is called with non-existent order ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(
        async () => await orderService.getById({ orderId: nonExistentId }),
        NotFoundError,
      );
    });

    test("Should throw 'DatabaseValidationError' when 'repo.getById' is called with invalid format order ID", async () => {
      // Arrange
      const invalidId = "invalid-id" as any;

      // Act & Assert
      await assert.rejects(
        async () => await orderService.getById({ orderId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("getAll", async () => {
    test("Should return orders array when 'repo.getAll' is called", async () => {
      // Arrange
      const ordersCount = 5;
      const mockOrders = generateMockInsertOrders(ordersCount);
      await Order.insertMany(mockOrders);

      // Act
      const result = await orderService.getAll();

      // Assert
      assert.ok(result);
      assert.ok(Array.isArray(result));
      assert.strictEqual(result.length, ordersCount);
    });

    test("Should return orders array when 'repo.getAll' is called with 'isPaid' true", async () => {
      // Arrange
      const isPaid = true;
      const mockOrder = generateMockInsertOrder({ isPaid });
      await Order.create(mockOrder);

      // Act
      const result = await orderService.getAll();

      // Assert
      assert.strictEqual(result[0].isPaid, isPaid);
      assert.ok(result[0].paidAt instanceof Date);
    });

    test("Should return orders array when 'repo.getAll' is called with 'isDelivered' true", async () => {
      // Arrange
      const isDelivered = true;
      const mockOrder = generateMockInsertOrder({ isDelivered });
      await Order.create(mockOrder);

      // Act
      const result = await orderService.getAll();

      // Assert
      assert.strictEqual(result[0].isDelivered, isDelivered);
      assert.ok(result[0].deliveredAt instanceof Date);
    });

    test("Should return empty array when 'repo.getAll' is called with no orders exist", async () => {
      // Act
      const result = await orderService.getAll();

      // Assert
      assert.strictEqual(result.length, 0);
    });
  });

  describe("getAllByUserId", async () => {
    test("Should return orders array for specific user when 'repo.getAllByUserId' is called with existing user ID", async () => {
      // Arrange
      const ordersCount = 3;
      const userId = generateMockObjectId();
      const mockOrders = generateMockInsertOrders(ordersCount, {
        user: userId,
      });
      await Order.insertMany(mockOrders);

      // Act
      const result = await orderService.getAllByUserId({
        userId,
      });

      // Assert
      assert.strictEqual(result.length, ordersCount);
      result.forEach((order) => {
        assert.ok(order._id instanceof Types.ObjectId);
        assert.strictEqual(typeof order.totalPrice, "number");
        assert.strictEqual(typeof order.isPaid, "boolean");
        assert.strictEqual(typeof order.isDelivered, "boolean");
      });
    });

    test("Should return orders array for specific user when 'repo.getAllByUserId' is called with 'isPaid' true", async () => {
      // Arrange
      const isPaid = true;
      const mockOrder = generateMockInsertOrder({ isPaid });
      await Order.create(mockOrder);

      // Act
      const result = await orderService.getAllByUserId({
        userId: mockOrder.user,
      });

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].isPaid, isPaid);
      assert.ok(result[0].paidAt instanceof Date);
    });

    test("Should return orders array for specific user when 'repo.getAllByUserId' is called with 'isDelivered' true", async () => {
      // Arrange
      const isDelivered = true;
      const mockOrder = generateMockInsertOrder({ isDelivered });
      await Order.create(mockOrder);

      // Act
      const result = await orderService.getAllByUserId({
        userId: mockOrder.user,
      });

      // Assert
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].isDelivered, isDelivered);
      assert.ok(result[0].deliveredAt instanceof Date);
    });

    test("Should return orders array ONLY for the specific user when 'repo.getAllByUserId' is called", async () => {
      // Arrange
      const userId1 = generateMockObjectId();
      const userId2 = generateMockObjectId();
      const mockOrderUser1 = generateMockInsertOrders(2, { user: userId1 });
      const mockOrderUser2 = generateMockInsertOrders(3, { user: userId2 });
      await Order.insertMany([...mockOrderUser1, ...mockOrderUser2]);

      // Act
      const result = await orderService.getAllByUserId({
        userId: userId1,
      });

      // Assert
      assert.strictEqual(result.length, 2);
    });
  });

  describe("updateToPaid", async () => {
    test("Should update order to paid when 'repo.updateToPaid' is called with order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder({ isPaid: false });
      const createdOrder = await Order.create(mockOrder);

      // Act
      const updatedOrder = await orderService.updateToPaid({
        orderId: createdOrder._id,
      });

      // Assert
      assert.strictEqual(updatedOrder.isPaid, true);
      assert.ok(updatedOrder.paidAt instanceof Date);
    });

    test("Should update 'paidAt' timestamp when 'repo.updateToPaid' is called with order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder({ isPaid: false });
      const createdOrder = await Order.create(mockOrder);
      const beforeUpdate = new Date();

      // Act
      const updatedOrder = await orderService.updateToPaid({
        orderId: createdOrder._id,
      });

      // Assert
      assert.ok(updatedOrder.paidAt instanceof Date);
      assert.ok(updatedOrder.paidAt >= beforeUpdate);
      assert.ok(updatedOrder.paidAt <= new Date());
    });

    test("Should throw 'NotFoundError' when 'repo.updateToPaid' is called with non-existent order ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(
        async () => await orderService.updateToPaid({ orderId: nonExistentId }),
        NotFoundError,
      );
    });
  });

  describe("updateToDelivered", async () => {
    test("Should update order to delivered when 'repo.updateToDelivered' is called with order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder({ isDelivered: false });
      const createdOrder = await Order.create(mockOrder);

      // Act
      const updatedOrder = await orderService.updateToDelivered({
        orderId: createdOrder._id,
      });

      // Assert
      assert.strictEqual(updatedOrder.isDelivered, true);
      assert.ok(updatedOrder.deliveredAt instanceof Date);
    });

    test("Should update 'deliveredAt' timestamp when 'repo.updateToDelivered' is called with order ID", async () => {
      // Arrange
      const mockOrder = generateMockInsertOrder({ isDelivered: false });
      const createdOrder = await Order.create(mockOrder);
      const beforeUpdate = new Date();

      // Act
      const updatedOrder = await orderService.updateToDelivered({
        orderId: createdOrder._id,
      });

      // Assert
      assert.ok(updatedOrder.deliveredAt instanceof Date);
      assert.ok(updatedOrder.deliveredAt >= beforeUpdate);
      assert.ok(updatedOrder.deliveredAt <= new Date());
    });

    test("Should throw 'NotFoundError' when 'repo.updateToDelivered' is called with non-existent order ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(
        async () =>
          await orderService.updateToDelivered({ orderId: nonExistentId }),
        NotFoundError,
      );
    });
  });
});
