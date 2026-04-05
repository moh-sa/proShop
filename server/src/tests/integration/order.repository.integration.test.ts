import { Types } from "mongoose";
import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { DatabaseValidationError } from "../../errors/index.js";
import { OrderModel } from "../../models/order.model.js";
import { UserModel } from "../../models/user.model.js";
import { OrderRepository } from "../../repositories/order.repository.js";
import { GetAllOrdersRepositoryParams } from "../../types/order.type.js";
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
		await OrderModel.deleteMany({});
		orderRepository = new OrderRepository();
	});

	describe("create", () => {
		test("Should create a new order when 'db.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await UserModel.create(mockUser);
			const mockOrder = generateMockInsertOrder({ user: mockUser });

			// Act
			const createdOrder = await orderRepository.create(mockOrder);

			// Assert
			assert.ok(createdOrder);
			assert.strictEqual(createdOrder.success, true);

			const resData = createdOrder.data;
			assert.strictEqual(
				resData.user._id.toString(),
				mockOrder.user._id.toString(),
			);
			assert.strictEqual(resData.user.name, mockUser.name);
			assert.strictEqual(resData.user.email, mockUser.email);
			assert.strictEqual(resData.itemsPrice, mockOrder.itemsPrice);
			assert.strictEqual(resData.shippingPrice, mockOrder.shippingPrice);
			assert.strictEqual(resData.taxPrice, mockOrder.taxPrice);
			assert.strictEqual(resData.totalPrice, mockOrder.totalPrice);
			assert.strictEqual(resData.status, mockOrder.status);
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
			const mockOrder = generateMockInsertOrder({ user: mockUser });
			const order = await OrderModel.create(mockOrder);
			await UserModel.create(mockUser);

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
				mockOrder.user._id.toString(),
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
			const mockOrder = generateMockInsertOrder({ user: mockUser });
			await UserModel.create(mockUser);
			const order = await OrderModel.create(mockOrder);

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
			const order = await OrderModel.create(mockOrder);

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

	describe("updatePayment", () => {
		test("Should update both 'payment.id' and 'payment.provider' in the database", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const order = await OrderModel.create(mockOrder);
			const paymentParams = {
				id: "pay_123",
				orderId: order._id,
				provider: "stripe" as const,
				sessionURL: "https://checkout.stripe.com/c/pay/cs_test_123",
			};

			// Act
			const result = await orderRepository.updatePayment(paymentParams);

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.strictEqual(result.data.payment?.id, paymentParams.id);
			assert.strictEqual(result.data.payment?.provider, paymentParams.provider);
			assert.strictEqual(
				result.data.payment?.sessionURL,
				paymentParams.sessionURL,
			);

			// Verify in DB
			const dbOrder = await OrderModel.findById(order._id).lean();
			assert.strictEqual(dbOrder?.payment?.id, paymentParams.id);
			assert.strictEqual(dbOrder?.payment?.provider, paymentParams.provider);
			assert.strictEqual(
				dbOrder?.payment?.sessionURL,
				paymentParams.sessionURL,
			);
		});

		test("Should update only 'payment.id' in the database", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const order = await OrderModel.create(mockOrder);
			const paymentParams = {
				id: "pay_456",
				orderId: order._id,
			};

			// Act
			const result = await orderRepository.updatePayment(paymentParams);

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.strictEqual(result.data.payment?.id, paymentParams.id);

			// Verify in DB
			const dbOrder = await OrderModel.findById(order._id).lean();
			assert.strictEqual(dbOrder?.payment?.id, paymentParams.id);
		});

		test("Should update only 'payment.provider' in the database", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const order = await OrderModel.create(mockOrder);
			const paymentParams = {
				orderId: order._id,
				provider: "stripe" as const,
			};

			// Act
			const result = await orderRepository.updatePayment(paymentParams);

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.strictEqual(result.data.payment?.provider, paymentParams.provider);

			// Verify in DB
			const dbOrder = await OrderModel.findById(order._id).lean();
			assert.strictEqual(dbOrder?.payment?.provider, paymentParams.provider);
		});

		test("Should update only 'payment.sessionURL' in the database", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const order = await OrderModel.create(mockOrder);
			const paymentParams = {
				orderId: order._id,
				sessionURL: "https://checkout.stripe.com/c/pay/cs_new",
			};

			// Act
			const result = await orderRepository.updatePayment(paymentParams);

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.strictEqual(
				result.data.payment?.sessionURL,
				paymentParams.sessionURL,
			);

			// Verify in DB
			const dbOrder = await OrderModel.findById(order._id).lean();
			assert.strictEqual(
				dbOrder?.payment?.sessionURL,
				paymentParams.sessionURL,
			);
		});

		test("Should return null data when attempting to update a non-existent order", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();
			const paymentParams = {
				id: "pay_789",
				orderId: nonExistentId,
				provider: "stripe" as const,
			};

			// Act
			const result = await orderRepository.updatePayment(paymentParams);

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'DatabaseValidationError' when providing an invalid 'orderId'", async () => {
			// Arrange
			const invalidId = "invalid-id" as any;
			const paymentParams = {
				id: "pay_789",
				orderId: invalidId,
				provider: "stripe" as const,
			};

			// Act
			const result = await orderRepository.updatePayment(paymentParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("getAll", () => {
		test("Should return paginated response with array of orders", async () => {
			// Arrange
			const mockOrders = generateMockInsertOrders(3);
			await OrderModel.insertMany(mockOrders);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, mockOrders.length);
		});

		test("Should return paginated response with meta data", async () => {
			// Arrange
			const mockOrders = generateMockInsertOrders(3);
			await OrderModel.insertMany(mockOrders);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(result.data.meta.totalItems, 3);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 10);
			assert.strictEqual(result.data.meta.totalPages, 1);
			assert.strictEqual(result.data.meta.hasNextPage, false);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);
		});

		test("Should return empty paginated response when no orders exist", async () => {
			// Arrange
			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);
			assert.strictEqual(result.data.meta.totalItems, 0);
		});

		test("Should return paginated response with correct page size", async () => {
			// Arrange
			const pageSize = 2;
			const mockOrders = generateMockInsertOrders(5);
			await OrderModel.insertMany(mockOrders);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize,
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(result.data.items.length, pageSize);
			assert.strictEqual(result.data.meta.pageSize, pageSize);
		});

		test("Should return second page when pageNumber is 2", async () => {
			// Arrange
			const pageSize = 2;
			const pageNumber = 2;
			const mockOrders = generateMockInsertOrders(5);
			await OrderModel.insertMany(mockOrders);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber,
				pageSize,
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(result.data.items.length, pageSize);
			assert.strictEqual(result.data.meta.currentPage, pageNumber);
		});

		test("Should return last page when pageNumber equals totalPages", async () => {
			// Arrange
			const mockOrders = generateMockInsertOrders(5);
			await OrderModel.insertMany(mockOrders);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 3,
				pageSize: 2,
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(result.data.items.length, 1);
			assert.strictEqual(result.data.meta.currentPage, 3);
			assert.strictEqual(result.data.meta.hasNextPage, false);
			assert.strictEqual(result.data.meta.hasPreviousPage, true);
		});

		test("Should filter orders by user when filters contain userId", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const userOrders = generateMockInsertOrders(2, {
				user: { _id: userId, name: "Test User", email: "test@example.com" },
			});
			const otherOrders = generateMockInsertOrders(3);
			await OrderModel.insertMany([...userOrders, ...otherOrders]);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				filters: {
					userId: userId.toString(),
				},
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(result.data.items.length, userOrders.length);
			assert.strictEqual(result.data.meta.totalItems, userOrders.length);
			assert.ok(
				result.data.items.every(
					(o) => o.user._id.toString() === userId.toString(),
				),
			);
		});

		test("Should filter orders by 'processing' when filters contain status 'processing'", async () => {
			// Arrange
			const paidOrders = generateMockInsertOrders(2, { status: "processing" });
			const unpaidOrders = generateMockInsertOrders(3, { status: "pending" });
			await OrderModel.insertMany([...paidOrders, ...unpaidOrders]);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				filters: { status: "processing" },
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(result.data.items.length, paidOrders.length);
			assert.strictEqual(result.data.meta.totalItems, paidOrders.length);
			assert.ok(result.data.items.every((o) => o.status === "processing"));
		});

		test("Should return only selected fields when select is provided", async () => {
			// Arrange
			const mockOrders = generateMockInsertOrders(2);
			await OrderModel.insertMany(mockOrders);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				select: { _id: true, status: true },
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 2);
			for (const item of result.data.items) {
				assert.ok(item._id);
				assert.ok(item.status);

				assert.strictEqual("orderItems" in item, false);
				assert.strictEqual("user" in item, false);
				assert.strictEqual("totalPrice" in item, false);
			}
		});

		test("Should sort orders by createdAt descending when sort is not provided", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(3).map((item, i) => ({
				...item,
				createdAt: new Date(2025, 0, i + 1),
			}));
			const expectedResult = mockOrders.sort((a, b) =>
				b.createdAt.toISOString().localeCompare(a.createdAt.toISOString()),
			);
			await OrderModel.insertMany(mockOrders);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(result.data.items.length, 3);
			assert.ok(
				result.data.items.every(
					(o, i) =>
						o.createdAt.toISOString() ===
						expectedResult[i].createdAt.toISOString(),
				),
			);
		});

		test("Should sort orders by createdAt ascending when sort is provided", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(3).map((item, i) => ({
				...item,
				createdAt: new Date(2025, 0, i + 1),
			}));
			const expectedResult = mockOrders.sort((a, b) =>
				a.createdAt.toISOString().localeCompare(b.createdAt.toISOString()),
			);
			await OrderModel.insertMany(mockOrders);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				sort: { createdAt: "asc" },
			};

			// Act
			const result = await orderRepository.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(result.data.items.length, 3);
			assert.ok(
				result.data.items.every(
					(o, i) =>
						o.createdAt.toISOString() ===
						expectedResult[i].createdAt.toISOString(),
				),
			);
		});
	});

	describe("markAsProcessing", () => {
		test("Should update 'paidAt', and 'status'", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const order = await OrderModel.create(mockOrder);

			const paidAt = new Date();

			// Act
			const result = await orderRepository.markAsProcessing({
				orderId: order._id.toString(),
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.strictEqual(result.data.status, "processing");
			assert.ok(result.data.payment);
			assert.strictEqual(
				result.data.payment.paidAt.getTime(),
				paidAt.getTime(),
			);
		});

		test("Should return null when order does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const result = await orderRepository.markAsProcessing({
				orderId: nonExistentId,
				paidAt: new Date(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'DatabaseValidationError' when orderId is invalid", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await orderRepository.markAsProcessing({
				orderId: invalidId,
				paidAt: new Date(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("markAsCancelled", () => {
		test("Should update 'status' to 'cancelled' in the database", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const order = await OrderModel.create(mockOrder);

			// Act
			const result = await orderRepository.markAsCancelled({
				orderId: order._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.strictEqual(result.data.status, "cancelled");

			// Verify in DB
			const dbOrder = await OrderModel.findById(order._id).lean();
			assert.strictEqual(dbOrder?.status, "cancelled");
		});

		test("Should return null when order does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const result = await orderRepository.markAsCancelled({
				orderId: nonExistentId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'DatabaseValidationError' when orderId is invalid", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await orderRepository.markAsCancelled({
				orderId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});
});
