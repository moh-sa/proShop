import { Types } from "mongoose";
import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { DatabaseValidationError } from "../../errors/index.js";
import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import { OrderRepository } from "../../repositories/order.repository.js";
import {
	generateMockInsertOrder,
	generateMockInsertOrders,
	generateMockObjectId,
	generateMockSelectOrders,
	generateMockSelectUser,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("OrderRepository 〖 Integration Tests 〗", async () => {
	let orderRepository: OrderRepository;

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(async () => {
		await Order.deleteMany({});
		orderRepository = new OrderRepository();
	});

	describe("create", () => {
		test("Should create a new order when 'db.create' is called with valid data", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();

			// Act
			const createdOrder = await orderRepository.create(mockOrder);

			// Assert
			assert.ok(createdOrder);
			assert.strictEqual(createdOrder.success, true);

			const resData = createdOrder.data;
			assert.strictEqual(resData.user.toString(), mockOrder.user.toString());
			assert.strictEqual(resData.paymentMethod, mockOrder.paymentMethod);
			assert.strictEqual(resData.itemsPrice, mockOrder.itemsPrice);
			assert.strictEqual(resData.shippingPrice, mockOrder.shippingPrice);
			assert.strictEqual(resData.taxPrice, mockOrder.taxPrice);
			assert.strictEqual(resData.totalPrice, mockOrder.totalPrice);
			assert.strictEqual(resData.isPaid, mockOrder.isPaid);
			assert.strictEqual(resData.isDelivered, mockOrder.isDelivered);
			assert.strictEqual(
				resData.orderItems.length,
				mockOrder.orderItems.length,
			);
		});

		test("Should set timestamps as Date objects when 'db.create' is called", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();

			// Act
			const createdOrder = await orderRepository.create(mockOrder);

			// Assert
			assert.strictEqual(createdOrder.success, true);
			assert.ok(createdOrder.data.createdAt instanceof Date);
			assert.ok(createdOrder.data.updatedAt instanceof Date);
		});

		test("Should create order with multiple items when 'db.create' is called", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			mockOrder.orderItems = Array.from({ length: 5 }, () => ({
				image: "test.jpg",
				name: "Test Product",
				price: 10,
				product: new Types.ObjectId(),
				qty: 2,
			}));

			// Act
			const createdOrder = await orderRepository.create(mockOrder);

			// Assert
			assert.strictEqual(createdOrder.success, true);
			assert.strictEqual(createdOrder.data.orderItems.length, 5);
			createdOrder.data.orderItems.forEach((item) => {
				assert.ok(item.product);
				assert.strictEqual(item.qty, 2);
				assert.strictEqual(item.price, 10);
			});
		});

		test("Should create order with zero items when 'db.create' is called", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			mockOrder.orderItems = [];

			// Act
			const createdOrder = await orderRepository.create(mockOrder);

			// Assert
			assert.strictEqual(createdOrder.success, true);
			assert.strictEqual(createdOrder.data.orderItems.length, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.create' is called without required fields", async () => {
			// Arrange
			const invalidOrder = {
				user: generateMockObjectId(),
				// Missing required fields
			};

			// Act
			// @ts-expect-error - test case
			const result = await orderRepository.create(invalidOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should handle Unicode characters in shipping address when 'db.create' is called", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			mockOrder.shippingAddress = {
				address: "123 🏠 Street",
				city: "São Paulo",
				country: "España",
				postalCode: "12345-678",
			};

			// Act
			const createdOrder = await orderRepository.create(mockOrder);

			// Assert
			assert.strictEqual(createdOrder.success, true);

			const resData = createdOrder.data;
			assert.strictEqual(
				resData.shippingAddress.address,
				mockOrder.shippingAddress.address,
			);
			assert.strictEqual(
				resData.shippingAddress.city,
				mockOrder.shippingAddress.city,
			);
			assert.strictEqual(
				resData.shippingAddress.country,
				mockOrder.shippingAddress.country,
			);
		});
	});

	describe("getById", () => {
		test("Should return order by ID when 'db.findById' is called with valid ID", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const mockOrder = generateMockInsertOrder({ user: mockUser._id });
			const order = await Order.create(mockOrder);
			await User.create(mockUser);

			// Act
			const foundOrder = await orderRepository.getById({
				orderId: order._id,
			});

			// Assert
			assert.ok(foundOrder);
			assert.strictEqual(foundOrder.success, true);
			assert.ok(foundOrder.data);
			assert.strictEqual(
				foundOrder.data.user._id.toString(),
				mockOrder.user.toString(),
			);
			assert.strictEqual(foundOrder.data.totalPrice, mockOrder.totalPrice);
		});

		test("Should return null when 'db.findById' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const order = await orderRepository.getById({ orderId: nonExistentId });

			// Assert
			assert.strictEqual(order.success, true);
			assert.strictEqual(order.data, null);
		});

		test("Should populate user details when 'db.findById' is called", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const mockOrder = generateMockInsertOrder({ user: mockUser._id });
			await User.create(mockUser);
			const order = await Order.create(mockOrder);

			// Act
			const foundOrder = await orderRepository.getById({
				orderId: order._id,
			});

			// Assert
			assert.ok(foundOrder);
			assert.strictEqual(foundOrder.success, true);
			assert.ok(foundOrder.data);
			assert.ok(foundOrder.data.user);
		});

		test("Should return 'DatabaseValidationError' when 'db.findById' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id" as any;

			// Act
			const result = await orderRepository.getById({ orderId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return complete order items when 'db.findById' is called", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			mockOrder.orderItems = Array.from({ length: 3 }, (_, i) => ({
				image: `image${i}.jpg`,
				name: `Product ${i}`,
				price: (i + 1) * 10,
				product: new Types.ObjectId(),
				qty: i + 1,
			}));
			const order = await Order.create(mockOrder);

			// Act
			const foundOrder = await orderRepository.getById({
				orderId: order._id,
			});

			// Assert
			assert.ok(foundOrder);
			assert.strictEqual(foundOrder.success, true);
			assert.ok(foundOrder.data);

			assert.strictEqual(foundOrder.data.orderItems.length, 3);
			foundOrder.data.orderItems.forEach((item, i) => {
				assert.strictEqual(item.name, `Product ${i}`);
				assert.strictEqual(item.qty, i + 1);
				assert.strictEqual(item.price, (i + 1) * 10);
			});
		});
	});

	describe("updateToDelivered", () => {
		test("Should mark order as delivered when 'db.updateToDelivered' is called", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			mockOrder.isDelivered = false;
			mockOrder.deliveredAt = undefined;
			const order = await Order.create(mockOrder);

			// Act
			const updatedOrder = await orderRepository.updateToDelivered({
				orderId: order._id,
			});

			// Assert
			assert.ok(updatedOrder);
			assert.strictEqual(updatedOrder.success, true);
			assert.ok(updatedOrder.data);
			assert.ok(updatedOrder.data.deliveredAt instanceof Date);
			assert.strictEqual(updatedOrder.data.isDelivered, true);
		});

		test("Should return null when 'db.updateToDelivered' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const order = await orderRepository.updateToDelivered({
				orderId: nonExistentId,
			});

			// Assert
			assert.strictEqual(order.success, true);
			assert.strictEqual(order.data, null);
		});

		test("Should update deliveredAt when 'db.updateToDelivered' is called on already delivered order", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			mockOrder.isDelivered = true;
			mockOrder.deliveredAt = new Date(2023, 0, 1); // January 1, 2023
			const order = await Order.create(mockOrder);

			// Act
			const updatedOrder = await orderRepository.updateToDelivered({
				orderId: order._id,
			});

			// Assert
			assert.ok(updatedOrder);
			assert.strictEqual(updatedOrder.success, true);
			assert.ok(updatedOrder.data);
			assert.ok(updatedOrder.data.deliveredAt! > mockOrder.deliveredAt);
		});

		test("Should throw 'DatabaseValidationError' when 'db.updateToDelivered' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id" as any;

			// Act
			const result = await orderRepository.updateToDelivered({
				orderId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("updateToPaid", () => {
		test("Should mark order as paid when 'db.updateToPaid' is called", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			mockOrder.isPaid = false;
			mockOrder.paidAt = undefined;
			const order = await Order.create(mockOrder);

			// Act
			const updatedOrder = await orderRepository.updateToPaid({
				orderId: order._id,
			});

			// Assert
			assert.ok(updatedOrder);
			assert.strictEqual(updatedOrder.success, true);
			assert.ok(updatedOrder.data);
			assert.ok(updatedOrder.data.paidAt instanceof Date);
			assert.strictEqual(updatedOrder.data.isPaid, true);
		});

		test("Should return null when 'db.updateToPaid' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const order = await orderRepository.updateToPaid({
				orderId: nonExistentId,
			});

			// Assert
			assert.strictEqual(order.success, true);
			assert.strictEqual(order.data, null);
		});

		test("Should update paidAt when 'db.updateToPaid' is called on already paid order", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			mockOrder.isPaid = true;
			mockOrder.paidAt = new Date(2023, 0, 1); // January 1, 2023
			const order = await Order.create(mockOrder);

			// Act
			const updatedOrder = await orderRepository.updateToPaid({
				orderId: order._id,
			});

			// Assert
			assert.ok(updatedOrder);
			assert.strictEqual(updatedOrder.success, true);
			assert.ok(updatedOrder.data);
			assert.ok(updatedOrder.data.paidAt! > mockOrder.paidAt);
		});

		test("Should return 'DatabaseValidationError' when 'db.updateToPaid' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id" as any;

			// Act
			const result = await orderRepository.updateToPaid({ orderId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("getAll", () => {
		test("Should return all orders when 'db.find' is called", async () => {
			// Arrange
			const mockOrders = generateMockInsertOrders(3);
			await Order.insertMany(mockOrders);

			// Act
			const orders = await orderRepository.getAll();

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, mockOrders.length);
			orders.data.forEach((order) => {
				assert.ok(order._id);
				assert.ok(order.createdAt);
				assert.ok("isPaid" in order);
				assert.ok("isDelivered" in order);
				assert.ok("totalPrice" in order);
			});
		});

		test("Should return empty array when 'db.find' is called with no orders exist", async () => {
			// Act
			const orders = await orderRepository.getAll();

			// Assert
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, 0);
		});

		test("Should return orders sorted by createdAt when 'db.find' is called", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(3).map((item, i) => ({
				...item,
				createdAt: new Date(2025, 0, i + 1),
			}));
			await Order.insertMany(mockOrders);

			// Act
			const orders = await orderRepository.getAll();

			// Assert
			assert.strictEqual(orders.success, true);
			assert.strictEqual(orders.data.length, 3);
			orders.data.forEach((order, i) => {
				if (i > 0) {
					assert.ok(order.createdAt >= orders.data[i - 1].createdAt);
				}
			});
		});

		test("Should return only selected fields when 'db.find' is called", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			await Order.insertMany(mockOrder);

			// Act
			const orders = await orderRepository.getAll();

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, 1);

			const order = orders.data[0];
			assert.ok(order._id);
			assert.ok(order.createdAt);
			assert.ok("isPaid" in order);
			assert.ok("isDelivered" in order);
			assert.ok("totalPrice" in order);
			assert.ok(!("orderItems" in order));
			assert.ok(!("shippingAddress" in order));
		});
	});

	describe("getAllByUserId", () => {
		test("Should return user orders when 'db.find' is called with valid user ID", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockOrders = generateMockInsertOrders(3, { user: userId });

			// Also create some orders for other users
			const otherOrders = generateMockInsertOrders(2);
			await Order.insertMany([...mockOrders, ...otherOrders]);

			// Act
			const orders = await orderRepository.getAllByUserId({ userId });

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));

			assert.strictEqual(orders.data.length, mockOrders.length);
			orders.data.forEach((order) => {
				assert.ok(order._id);
				assert.ok(order.createdAt);
				assert.ok("isPaid" in order);
				assert.ok("isDelivered" in order);
				assert.ok("totalPrice" in order);
			});
		});

		test("Should return empty array when 'db.find' is called with user having no orders", async () => {
			// Arrange
			const userId = generateMockObjectId();

			// Act
			const orders = await orderRepository.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.find' is called with invalid user ID", async () => {
			// Arrange
			const invalidUserId = "invalid-id" as any;

			// Act
			const result = await orderRepository.getAllByUserId({
				userId: invalidUserId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return orders sorted by createdAt when 'db.find' is called with user ID", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockOrders = generateMockSelectOrders(3).map((order, i) => ({
				...order,
				createdAt: new Date(2023, 0, i + 1), // January 1-3, 2023
				user: userId,
			}));
			await Order.insertMany(mockOrders);

			// Act
			const orders = await orderRepository.getAllByUserId({ userId });

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));

			assert.strictEqual(orders.data.length, 3);
			orders.data.forEach((order, i) => {
				if (i > 0) {
					assert.ok(order.createdAt >= orders.data[i - 1].createdAt);
				}
			});
		});

		test("Should return only selected fields when 'db.find' is called with user ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const userId = mockOrder.user;

			await Order.insertMany(mockOrder);

			// Act
			const orders = await orderRepository.getAllByUserId({ userId });

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, 1);

			const order = orders.data[0];
			assert.ok(order);
			assert.ok(order._id);
			assert.ok(order.createdAt);
			assert.ok("isPaid" in order);
			assert.ok("isDelivered" in order);
			assert.ok("totalPrice" in order);
			assert.ok(!("orderItems" in order));
			assert.ok(!("shippingAddress" in order));
		});
	});
});
