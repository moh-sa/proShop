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
				user: mockUser,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.orderItems.length, orderItemsCount);
			assert.strictEqual(result.data.totalPrice, mockOrder.totalPrice);
			assert.strictEqual(
				result.data.user._id.toString(),
				mockUser._id._id.toString(),
			);
		});

		test("Should create and return order object when 'repo.create' is called with '3' order items", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const orderItemsCount = 3;
			const mockOrder = generateMockInsertOrder({
				orderItemsCount,
				user: mockUser,
			});

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.orderItems.length, orderItemsCount);
			assert.strictEqual(result.data.totalPrice, mockOrder.totalPrice);
			assert.strictEqual(
				result.data.user._id.toString(),
				mockUser._id._id.toString(),
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
			const mockOrder = generateMockInsertOrder({ user: mockUser });
			const expectedAddress = mockOrder.shippingAddress;

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data.shippingAddress, expectedAddress);
		});

		test("Should create and return order object when 'repo.create' is called with tax price", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const taxPrice = 10.99;
			const mockOrder = generateMockInsertOrder({
				taxPrice,
				user: mockUser,
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
				user: mockUser,
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
				user: mockUser,
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
				user: mockUser,
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
				user: mockUser,
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
			const mockOrder = generateMockInsertOrder({ user: mockUser });

			// Act
			const result = await orderService.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.createdAt instanceof Date);
			assert.ok(result.data.createdAt >= beforeCreate);
			assert.ok(result.data.createdAt <= new Date());
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
			assert.deepStrictEqual(result.data.payment, createdOrder.payment);
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
			const userOrders = generateMockInsertOrders(2, {
				user: { _id: userId, name: "Test User", email: "test@example.com" },
			});
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
				result.data.items.every(
					(o) => o.user._id.toString() === userId.toString(),
				),
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
			const user = {
				_id: userId,
				name: "Test User",
				email: "test@example.com",
			};
			const paidDeliveredOrders = generateMockInsertOrders(2, {
				status: "delivered",
				user: user,
			});
			const paidUndeliveredOrders = generateMockInsertOrders(2, {
				status: "processing",
				user: user,
			});
			const unpaidOrders = generateMockInsertOrders(2, {
				status: "pending",
				user: user,
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
				result.data.items.every(
					(o) => o.user._id.toString() === userId.toString(),
				),
			);
			assert.ok(result.data.items.every((o) => o.status === "delivered"));
		});
	});

	describe("markAsProcessing", async () => {
		test("Should update order to processing and set paidAt when order exists", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({
				status: "pending",
			});
			const createdOrder = await Order.create(mockOrder);

			const orderId = createdOrder._id.toString();
			const paidAt = new Date();

			// Act
			const result = await orderService.markAsProcessing({
				orderId,
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.strictEqual(result.data.status, "processing");
			assert.strictEqual(result.data.paidAt?.getTime(), paidAt.getTime());
		});

		test("Should return NotFoundError when order does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const result = await orderService.markAsProcessing({
				orderId: nonExistentId,
				paidAt: new Date(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});
	});

	describe("markAsCancelled", async () => {
		test("Should update order status to cancelled and persist to database when order exists", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.markAsCancelled({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.strictEqual(result.data.status, "cancelled");

			// Verify in DB
			const dbOrder = await Order.findById(orderId).lean();
			assert.strictEqual(dbOrder?.status, "cancelled");
		});

		test("Should return NotFoundError when order does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const result = await orderService.markAsCancelled({
				orderId: nonExistentId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});
	});

	describe("updatePayment", async () => {
		test("Should update payment on existing order and persist to database", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({
				status: "processing",
				payment: undefined,
			});
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();
			const newPaymentId = "pay_stripe_456";
			const provider = "stripe";
			const sessionURL = "https://checkout.stripe.com/c/pay/cs_test_456";

			// Act
			const result = await orderService.updatePayment({
				orderId,
				id: newPaymentId,
				provider,
				sessionURL,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.payment?.id, newPaymentId);
			assert.strictEqual(result.data.payment?.provider, provider);
			assert.strictEqual(result.data.payment?.sessionURL, sessionURL);

			// Verify in DB
			const dbOrder = await Order.findById(orderId).lean();
			assert.strictEqual(dbOrder?.payment?.sessionURL, sessionURL);
		});

		test("Should return 'NotFoundError' when order does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const result = await orderService.updatePayment({
				orderId: nonExistentId,
				id: "pay_123",
				provider: "stripe",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should keep existing provider when updating only payment id", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({
				status: "processing",
				payment: {
					id: "cs_123",
					provider: "stripe",
					sessionURL: "https://checkout.stripe.com/c/pay/cs_123",
				},
			});
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();
			const paymentId = "cs_456";

			// Act
			const result = await orderService.updatePayment({
				orderId,
				id: paymentId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.payment?.id, paymentId);
			assert.strictEqual(result.data.payment?.provider, "stripe");
		});

		test("Should keep existing payment id when updating only payment provider", async () => {
			// Arrange
			const paymentId = "cs_123";
			const mockOrder = generateMockInsertOrder({
				status: "processing",
				payment: {
					id: paymentId,
					provider: "stripe",
					sessionURL: "https://checkout.stripe.com/c/pay/cs_123",
				},
			});
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderService.updatePayment({
				orderId,
				provider: "stripe",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.payment?.id, paymentId);
			assert.strictEqual(result.data.payment?.provider, "stripe");
		});

		test("Should update the sessionURL when provided", async () => {
			// Arrange
			const paymentId = "cs_123";
			const oldSessionURL = "https://checkout.stripe.com/c/pay/cs_old";
			const mockOrder = generateMockInsertOrder({
				status: "processing",
				payment: {
					id: paymentId,
					provider: "stripe",
					sessionURL: oldSessionURL,
				},
			});
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();
			const newSessionURL = "https://checkout.stripe.com/c/pay/cs_new";

			// Act
			const result = await orderService.updatePayment({
				orderId,
				sessionURL: newSessionURL,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.payment?.sessionURL, newSessionURL);
			assert.strictEqual(result.data.payment?.id, paymentId);
			assert.strictEqual(result.data.payment?.provider, "stripe");
		});

		test("Should add payment to order that had no payment", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({
				status: "pending",
				payment: undefined,
			});
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();
			const paymentId = "pay_added_789";
			const provider = "stripe";
			const sessionURL = "https://checkout.stripe.com/c/pay/cs_added";

			// Act
			const result = await orderService.updatePayment({
				orderId,
				id: paymentId,
				provider,
				sessionURL,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.payment?.id, paymentId);
			assert.strictEqual(result.data.payment?.provider, provider);
			assert.strictEqual(result.data.payment?.sessionURL, sessionURL);
		});
	});
});
