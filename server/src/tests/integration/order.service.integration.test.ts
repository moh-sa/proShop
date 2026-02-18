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
	generateMockSelectOrders,
} from "../mocks/order.mock.js";
import { generateMockSelectUser } from "../mocks/user.mock.js";
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
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const orderItemsCount = 1;
			const mockOrder = generateMockInsertOrder({
				orderItemsCount,
				user: mockUser._id,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.orderItems.length, orderItemsCount);
			assert.strictEqual(result.data.totalPrice, mockOrder.totalPrice);
			assert.strictEqual(
				result.data.user._id.toString(),
				mockUser._id.toString(),
			);
		});

		test("Should create and return order object when 'repo.create' is called with '3' order items", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const orderItemsCount = 3;
			const mockOrder = generateMockInsertOrder({
				orderItemsCount,
				user: mockUser._id,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.orderItems.length, orderItemsCount);
			assert.strictEqual(result.data.totalPrice, mockOrder.totalPrice);
			assert.strictEqual(
				result.data.user._id.toString(),
				mockUser._id.toString(),
			);
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
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrder = generateMockInsertOrder({ user: mockUser._id });
			const expectedAddress = mockOrder.shippingAddress;

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data.shippingAddress, expectedAddress);
		});

		test("Should create and return order object when 'repo.create' is called with payment method", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const paymentMethod = "Stripe";
			const mockOrder = generateMockInsertOrder({
				paymentMethod,
				user: mockUser._id,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.paymentMethod, paymentMethod);
		});

		test("Should create and return order object when 'repo.create' is called with tax price", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const taxPrice = 10.99;
			const mockOrder = generateMockInsertOrder({
				taxPrice,
				user: mockUser._id,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.taxPrice, taxPrice);
		});

		test("Should create and return order object when 'repo.create' is called with shipping price", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const shippingPrice = 5.99;
			const mockOrder = generateMockInsertOrder({
				shippingPrice,
				user: mockUser._id,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.shippingPrice, shippingPrice);
		});

		test("Should create and return order object when 'repo.create' is called with total price", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const itemsPrice = 100;
			const taxPrice = 20;
			const shippingPrice = 10;
			const totalPrice = 130;
			const mockOrder = generateMockInsertOrder({
				itemsPrice,
				shippingPrice,
				taxPrice,
				totalPrice,
				user: mockUser._id,
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

		test("Should NOT set 'paidAt' when 'repo.create' is called", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrder = generateMockInsertOrder({
				status: "pending",
				user: mockUser._id,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.status, "pending");
			assert.strictEqual(result.data.paidAt, undefined);
		});

		test("Should NOT set 'deliveredAt' when 'repo.create' is called", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrder = generateMockInsertOrder({
				status: "pending",
				user: mockUser._id,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.status, "pending");
			assert.strictEqual(result.data.deliveredAt, undefined);
		});

		test("Should create and return order object when 'repo.create' is called with current timestamp as createdAt", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const beforeCreate = new Date();
			const mockOrder = generateMockInsertOrder({ user: mockUser._id });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.createdAt instanceof Date);
			assert.ok(result.data.createdAt >= beforeCreate);
			assert.ok(result.data.createdAt <= new Date());
		});

		test("Should set 'PaymentMethod' to 'Stripe' if not provided when 'repo.create' is called", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockInsertOrder = generateMockInsertOrder({ user: mockUser._id });
			// @ts-expect-error - test case
			mockInsertOrder.paymentMethod = undefined;

			// Act
			const result = await orderService.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.paymentMethod, "Stripe");
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
			const mockOrder = generateMockInsertOrder({ status: "processing" });
			const createdOrder = (await Order.create(mockOrder)).toObject();
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.status, "processing");
			assert.deepStrictEqual(
				result.data.paymentResult,
				createdOrder.paymentResult,
			);
		});

		test("Should return order object with delivery status when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "delivered" });
			const createdOrder = (await Order.create(mockOrder)).toObject();
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.status, "delivered");
			assert.ok(result.data.deliveredAt instanceof Date);
		});

		test("Should return order object with payment status when 'repo.getById' is called with existing order ID", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "processing" });
			const createdOrder = (await Order.create(mockOrder)).toObject();
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.getById({
				orderId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.status, "processing");
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
		test("Should return orders when called with valid pagination parameters", async () => {
			// Arrange
			const ordersCount = 5;
			const mockOrders = generateMockInsertOrders(ordersCount);
			await Order.insertMany(mockOrders);

			const paginationArgs = {
				pageNumber: "1",
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, ordersCount);
			assert.ok(result.data.meta);
		});

		test("Should filter orders by user when user parameter is provided", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const userOrders = generateMockInsertOrders(2, { user: userId });
			const otherOrders = generateMockInsertOrders(3);
			await Order.insertMany([...userOrders, ...otherOrders]);

			const paginationArgs = {
				pageNumber: "1",
				user: userId.toString(),
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 2);
			assert.ok(
				result.data.items.every((o) => o.user.toString() === userId.toString()),
			);
		});

		test("Should filter orders by status when it is processing", async () => {
			// Arrange
			const paidOrders = generateMockInsertOrders(2, { status: "processing" });
			const unpaidOrders = generateMockInsertOrders(3, { status: "pending" });
			await Order.insertMany([...paidOrders, ...unpaidOrders]);

			const paginationArgs = {
				status: "processing",
				pageNumber: "1",
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 2);
			assert.ok(result.data.items.every((o) => o.status === "processing"));
		});

		test("Should filter orders by status when it is delivered", async () => {
			// Arrange
			const deliveredOrders = generateMockInsertOrders(2, {
				status: "delivered",
			});
			const undeliveredOrders = generateMockInsertOrders(3, {
				status: "pending",
			});
			await Order.insertMany([...deliveredOrders, ...undeliveredOrders]);

			const paginationArgs = {
				status: "delivered",
				pageNumber: "1",
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 2);
			assert.ok(result.data.items.every((o) => o.status === "delivered"));
		});

		test("Should sort orders by createdAt descending when sort parameter is provided", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(3);
			await Order.insertMany(mockOrders);

			const paginationArgs = {
				pageNumber: "1",
				sort: "createdAt:desc",
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 3);
			// Verify sorting by checking first two items
			assert.ok(
				result.data.items[0].createdAt >= result.data.items[1].createdAt,
			);
		});

		test("Should sort orders by createdAt ascending when sort parameter is provided", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(3);
			await Order.insertMany(mockOrders);

			const paginationArgs = {
				pageNumber: "1",
				sort: "createdAt:asc",
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 3);
			// Verify sorting by checking first two items
			assert.ok(
				result.data.items[0].createdAt <= result.data.items[1].createdAt,
			);
		});

		test("Should return empty response when no orders exist", async () => {
			// Arrange
			const paginationArgs = {
				pageNumber: "1",
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);
		});

		test("Should return ValidationError when pageNumber is invalid", async () => {
			// Arrange
			const invalidArgs = {
				pageNumber: "invalid",
			};

			// Act
			const result = await orderService.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return ValidationError when pageSize is invalid", async () => {
			// Arrange
			const invalidArgs = {
				pageNumber: "1",
				pageSize: "invalid",
			};

			// Act
			const result = await orderService.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return ValidationError when user parameter is invalid ObjectId", async () => {
			// Arrange
			const invalidArgs = {
				pageNumber: "1",
				user: "invalid-user-id",
			};

			// Act
			const result = await orderService.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return ValidationError when status parameter is invalid", async () => {
			// Arrange
			const invalidArgs = {
				status: "invalid-status",
				pageNumber: "1",
			};

			// Act
			const result = await orderService.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return orders with correct field projection", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "delivered" });
			await Order.create(mockOrder);

			const paginationArgs = {
				pageNumber: "1",
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 1);

			const order = result.data.items[0];
			// Verify that only the projected fields are present
			assert.strictEqual("_id" in order, true);
			assert.strictEqual("createdAt" in order, true);
			assert.strictEqual("status" in order, true);
			assert.strictEqual("paidAt" in order, true);
			assert.strictEqual("deliveredAt" in order, true);
			assert.strictEqual("totalPrice" in order, true);
			assert.strictEqual("user" in order, true);
			assert.strictEqual("orderItems" in order, false);
			assert.strictEqual("shippingAddress" in order, false);
		});

		test("Should handle multiple filter parameters correctly", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const paidDeliveredOrders = generateMockInsertOrders(2, {
				status: "delivered",
				user: userId,
			});
			const paidUndeliveredOrders = generateMockInsertOrders(2, {
				status: "processing",
				user: userId,
			});
			const unpaidOrders = generateMockInsertOrders(2, {
				status: "pending",
				user: userId,
			});
			await Order.insertMany([
				...paidDeliveredOrders,
				...paidUndeliveredOrders,
				...unpaidOrders,
			]);

			const paginationArgs = {
				status: "delivered",
				pageNumber: "1",
				user: userId.toString(),
			};

			// Act
			const result = await orderService.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 2);
			assert.ok(
				result.data.items.every((o) => o.user.toString() === userId.toString()),
			);
			assert.ok(result.data.items.every((o) => o.status === "delivered"));
		});
	});

	describe("updateStatus", async () => {
		test("Should update order status to 'processing' when 'repo.updateStatus' is called with status 'processing'", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateStatus({
				orderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.strictEqual(updatedOrder.data.status, "processing");
			assert.ok(updatedOrder.data.paidAt instanceof Date);
		});

		test("Should update 'paidAt' when 'repo.updateStatus' is called with status 'processing'", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const createdOrder = await Order.create(mockOrder);
			const beforeUpdate = new Date();
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateStatus({
				orderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.ok(updatedOrder.data.paidAt instanceof Date);
			assert.ok(updatedOrder.data.paidAt >= beforeUpdate);
			assert.ok(updatedOrder.data.paidAt <= new Date());
		});

		test("Should update order status to 'delivered' when 'repo.updateStatus' is called with status 'delivered'", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "processing" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateStatus({
				orderId,
				status: "delivered",
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.strictEqual(updatedOrder.data.status, "delivered");
			assert.ok(updatedOrder.data.deliveredAt instanceof Date);
		});

		test("Should update 'deliveredAt' when 'repo.updateStatus' is called with status 'delivered'", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "processing" });
			const createdOrder = await Order.create(mockOrder);
			const beforeUpdate = new Date();
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateStatus({
				orderId,
				status: "delivered",
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.ok(updatedOrder.data.deliveredAt instanceof Date);
			assert.ok(updatedOrder.data.deliveredAt >= beforeUpdate);
			assert.ok(updatedOrder.data.deliveredAt <= new Date());
		});

		test("Should update order status to 'cancelled' when 'repo.updateStatus' is called with status 'cancelled'", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({
				status: "pending",
				paidAt: undefined,
				deliveredAt: undefined,
			});
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const updatedOrder = await orderService.updateStatus({
				orderId,
				status: "cancelled",
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.strictEqual(updatedOrder.data.status, "cancelled");
			assert.strictEqual(updatedOrder.data.paidAt, undefined);
			assert.strictEqual(updatedOrder.data.deliveredAt, undefined);
		});

		test("Should return 'ValidationError' when transition is not allowed (pending -> delivered)", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.updateStatus({
				orderId,
				status: "delivered",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should throw 'NotFoundError' when 'repo.updateStatus' is called with non-existent order ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const updatedOrder = await orderService.updateStatus({
				orderId: nonExistentId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof NotFoundError);
		});
	});
});
