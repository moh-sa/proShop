import { Types } from "mongoose";
import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { NotFoundError, ValidationError } from "../../errors/index.js";
import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import { OrderService } from "../../services/index.js";
import { generateMockObjectId } from "../mocks/objectid.mock.js";
import {
	generateMockInsertOrder,
	generateMockInsertOrders,
} from "../mocks/order.mock.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

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
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.orderItems.length, orderItemsCount);
			assert.strictEqual(result.data.totalPrice, mockOrder.totalPrice);
		});

		test("Should create and return order object when 'repo.create' is called with '3' order items", async () => {
			// Arrange
			const orderItemsCount = 3;
			const mockOrder = generateMockInsertOrder({ orderItemsCount });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.orderItems.length, orderItemsCount);
			assert.strictEqual(result.data.totalPrice, mockOrder.totalPrice);
		});

		test("Should throw 'ValidationError' when 'repo.create' is called with empty array of order items", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ orderItems: [] });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should create and return order object when 'repo.create' is called with shipping address", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const expectedAddress = mockOrder.shippingAddress;

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data.shippingAddress, expectedAddress);
		});

		test("Should create and return order object when 'repo.create' is called with payment method", async () => {
			// Arrange
			const paymentMethod = "PayPal";
			const mockOrder = generateMockInsertOrder({ paymentMethod });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.paymentMethod, paymentMethod);
		});

		test("Should create and return order object when 'repo.create' is called with tax price", async () => {
			// Arrange
			const taxPrice = 10.99;
			const mockOrder = generateMockInsertOrder({ taxPrice });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.taxPrice, taxPrice);
		});

		test("Should create and return order object when 'repo.create' is called with shipping price", async () => {
			// Arrange
			const shippingPrice = 5.99;
			const mockOrder = generateMockInsertOrder({ shippingPrice });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.shippingPrice, shippingPrice);
		});

		test("Should create and return order object when 'repo.create' is called with total price", async () => {
			// Arrange
			const itemsPrice = 100;
			const taxPrice = 20;
			const shippingPrice = 10;
			const totalPrice = 130;
			const mockOrder = generateMockInsertOrder({
				itemsPrice,
				shippingPrice,
				taxPrice,
				totalPrice,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.itemsPrice, itemsPrice);
			assert.strictEqual(result.data.taxPrice, taxPrice);
			assert.strictEqual(result.data.shippingPrice, shippingPrice);
			assert.strictEqual(result.data.totalPrice, totalPrice);
		});

		test("Should create and return order object when 'repo.create' is called with isPaid false by default", async () => {
			// Arrange
			const isPaid = false;
			const mockOrder = generateMockInsertOrder({ isPaid });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isPaid, isPaid);
			assert.strictEqual(result.data.paidAt, undefined);
		});

		test("Should create and return order object when 'repo.create' is called with isDelivered false by default", async () => {
			// Arrange
			const isDelivered = false;
			const mockOrder = generateMockInsertOrder({ isDelivered });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isDelivered, isDelivered);
			assert.strictEqual(result.data.deliveredAt, undefined);
		});

		test("Should create and return order object when 'repo.create' is called with current timestamp as createdAt", async () => {
			// Arrange
			const beforeCreate = new Date();
			const mockOrder = generateMockInsertOrder();

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.createdAt instanceof Date);
			assert.ok(result.data.createdAt >= beforeCreate);
			assert.ok(result.data.createdAt <= new Date());
		});

		test("Should set 'PaymentMethod' to 'PayPal' if not provided when 'repo.create' is called", async () => {
			// Arrange
			const mockInsertOrder = generateMockInsertOrder();
			// @ts-expect-error - test case
			mockInsertOrder.paymentMethod = undefined;

			// Act
			const result = await orderService.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.paymentMethod, "PayPal");
		});
	});

	describe("getById", async () => {
		test("Should return order object by its ID when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id;

			// Act
			const result = await orderService.getById({
				orderId: orderId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data._id, orderId);
			assert.strictEqual(result.data.totalPrice, createdOrder.totalPrice);
		});

		test("Should return order object with 3 order items when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const orderItemsCount = 3;
			const mockOrder = generateMockInsertOrder({ orderItemsCount });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.orderItems.length, orderItemsCount);
			result.data.orderItems.forEach((item, index) => {
				assert.strictEqual(item.price, createdOrder.orderItems[index].price);
				assert.strictEqual(item.qty, createdOrder.orderItems[index].qty);
				assert.strictEqual(item.name, createdOrder.orderItems[index].name);
			});
		});

		test("Should return order object with shipping address when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const createdOrder = (await Order.create(mockOrder)).toObject();
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(
				result.data.shippingAddress,
				createdOrder.shippingAddress,
			);
		});

		test("Should return order object with payment details when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isPaid: true });
			const createdOrder = (await Order.create(mockOrder)).toObject();
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isPaid, true);
			assert.deepStrictEqual(
				result.data.paymentResult,
				createdOrder.paymentResult,
			);
		});

		test("Should return order object with delivery status when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isDelivered: true });
			const createdOrder = (await Order.create(mockOrder)).toObject();
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isDelivered, true);
			assert.ok(result.data.deliveredAt instanceof Date);
		});

		test("Should return order object with payment status when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isPaid: true });
			const createdOrder = (await Order.create(mockOrder)).toObject();
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isPaid, true);
			assert.ok(result.data.paidAt instanceof Date);
		});

		test("Should return order object with timestamps when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const createdOrder = (await Order.create(mockOrder)).toObject();
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.createdAt instanceof Date);
			assert.ok(result.data.updatedAt instanceof Date);
		});

		test("Should throw 'NotFoundError' when 'repo.getById' is called with non-existent order ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const result = await orderService.getById({ orderId: nonExistentId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should throw 'ValidationError' when 'repo.getById' is called with invalid format order ID", async () => {
			// Arrange
			const invalidId = "invalid-order-id";

			// Act
			const result = await orderService.getById({ orderId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
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
			assert.strictEqual(result.success, true);
			assert.ok(Array.isArray(result.data));
			assert.strictEqual(result.data.length, ordersCount);
		});

		test("Should return orders array when 'repo.getAll' is called with 'isPaid' true", async () => {
			// Arrange
			const isPaid = true;
			const mockOrder = generateMockInsertOrder({ isPaid });
			await Order.create(mockOrder);

			// Act
			const result = await orderService.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data[0].isPaid, isPaid);
			assert.ok(result.data[0].paidAt instanceof Date);
		});

		test("Should return orders array when 'repo.getAll' is called with 'isDelivered' true", async () => {
			// Arrange
			const isDelivered = true;
			const mockOrder = generateMockInsertOrder({ isDelivered });
			await Order.create(mockOrder);

			// Act
			const result = await orderService.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data[0].isDelivered, isDelivered);
			assert.ok(result.data[0].deliveredAt instanceof Date);
		});

		test("Should return empty array when 'repo.getAll' is called with no orders exist", async () => {
			// Act
			const result = await orderService.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 0);
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
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, ordersCount);
			result.data.forEach((order) => {
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
			const userId = mockOrder.user.toString();
			await Order.create(mockOrder);

			// Act
			const result = await orderService.getAllByUserId({
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 1);
			assert.strictEqual(result.data[0].isPaid, isPaid);
			assert.ok(result.data[0].paidAt instanceof Date);
		});

		test("Should return orders array for specific user when 'repo.getAllByUserId' is called with 'isDelivered' true", async () => {
			// Arrange
			const isDelivered = true;
			const mockOrder = generateMockInsertOrder({ isDelivered });
			const userId = mockOrder.user.toString();
			await Order.create(mockOrder);

			// Act
			const result = await orderService.getAllByUserId({
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 1);
			assert.strictEqual(result.data[0].isDelivered, isDelivered);
			assert.ok(result.data[0].deliveredAt instanceof Date);
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
				userId: userId1.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 2);
		});
	});

	describe("updateToPaid", async () => {
		test("Should update order to paid when 'repo.updateToPaid' is called with order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isPaid: false });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateToPaid({
				orderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.strictEqual(updatedOrder.data.isPaid, true);
			assert.ok(updatedOrder.data.paidAt instanceof Date);
		});

		test("Should update 'paidAt' timestamp when 'repo.updateToPaid' is called with order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isPaid: false });
			const createdOrder = await Order.create(mockOrder);
			const beforeUpdate = new Date();
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateToPaid({
				orderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.ok(updatedOrder.data.paidAt instanceof Date);
			assert.ok(updatedOrder.data.paidAt >= beforeUpdate);
			assert.ok(updatedOrder.data.paidAt <= new Date());
		});

		test("Should throw 'NotFoundError' when 'repo.updateToPaid' is called with non-existent order ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const updatedOrder = await orderService.updateToPaid({
				orderId: nonExistentId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof NotFoundError);
		});
	});

	describe("updateToDelivered", async () => {
		test("Should update order to delivered when 'repo.updateToDelivered' is called with order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isDelivered: false });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateToDelivered({
				orderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.strictEqual(updatedOrder.data.isDelivered, true);
			assert.ok(updatedOrder.data.deliveredAt instanceof Date);
		});

		test("Should update 'deliveredAt' timestamp when 'repo.updateToDelivered' is called with order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isDelivered: false });
			const createdOrder = await Order.create(mockOrder);
			const beforeUpdate = new Date();
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateToDelivered({
				orderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.ok(updatedOrder.data.deliveredAt instanceof Date);
			assert.ok(updatedOrder.data.deliveredAt >= beforeUpdate);
			assert.ok(updatedOrder.data.deliveredAt <= new Date());
		});

		test("Should throw 'NotFoundError' when 'repo.updateToDelivered' is called with non-existent order ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const updatedOrder = await orderService.updateToDelivered({
				orderId: nonExistentId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof NotFoundError);
		});
	});
});
