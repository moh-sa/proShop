import mongoose from "mongoose";
import assert from "node:assert";
import test, { describe, suite } from "node:test";

import {
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	DatabaseValidationError,
	GenericDatabaseError,
} from "../../errors/index.js";
import { OrderModel } from "../../models/order.model.js";
import { OrderRepository } from "../../repositories/index.js";
import type { GetAllOrdersRepositoryParams } from "../../types/order.type.js";
import { Paginator } from "../../utils/paginator.util.js";
import {
	generateMockInsertOrder,
	generateMockInsertOrders,
	generateMockObjectId,
	generateMockSelectOrder,
} from "../mocks/index.js";

suite("Order Repository 〖 Unit Tests 〗", () => {
	const repo = new OrderRepository();

	describe("create", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockSelectOrder = generateMockSelectOrder({
			user: mockInsertOrder.user,
		});

		test("Should return the user object when 'db.create' is called once with user data", async (t) => {
			// Arrange

			const mockCreate = t.mock.method(OrderModel, "create", () => ({
				toObject: () => mockSelectOrder,
			}));

			// Act
			const order = await repo.create(mockInsertOrder);

			// Assert
			assert.ok(order);
			assert.strictEqual(order.success, true);
			assert.deepStrictEqual(order.data, mockSelectOrder);

			assert.strictEqual(mockCreate.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockCreate.mock.calls[0].arguments[0],
				mockInsertOrder,
			);
		});

		test("Should return 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(OrderModel, "create", () => {
				throw validationError;
			});

			// Act
			const result = await repo.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(OrderModel, "create", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(OrderModel, "create", () => {
				throw queryError;
			});

			// Act
			const result = await repo.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(OrderModel, "create", () => {
				throw networkError;
			});

			// Act
			const result = await repo.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(OrderModel, "create", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAll", () => {
		const mockOrders = generateMockInsertOrders(4);
		const mockPaginatedResponse = {
			items: mockOrders,
			meta: {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 4,
				totalPages: 1,
			},
		};

		test("Should return successful result when paginator.paginate succeeds", async (t) => {
			// Arrange
			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve(mockPaginatedResponse),
			);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockPaginatedResponse);
		});

		test("Should return 'DatabaseValidationError' when paginator.paginate throws ValidationError", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when paginator.paginate throws MongoNetworkTimeoutError", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when paginator.paginate throws MongooseError", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when paginator.paginate throws MongoError", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when paginator.paginate throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});

		test("Should pass filters to paginator as match query", async (t) => {
			// Arrange
			const userId = generateMockObjectId();
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve(mockPaginatedResponse),
			);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				filters: {
					userId: userId.toString(),
					status: "processing",
				},
			};

			// Act
			await repo.getAll(paginationArgs);

			// Assert
			const callArgs = paginateMock.mock.calls[0]?.arguments[0] as {
				query?: Record<string, unknown>;
			};
			assert.ok(callArgs?.query);
			assert.ok(callArgs.query["user._id"] instanceof mongoose.Types.ObjectId);
			assert.strictEqual(
				(callArgs.query["user._id"] as mongoose.Types.ObjectId).toString(),
				userId.toString(),
			);
			assert.strictEqual(callArgs.query.status, "processing");
		});

		test("Should pass select to paginator", async (t) => {
			// Arrange
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve(mockPaginatedResponse),
			);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				select: { _id: true, status: true },
			};

			// Act
			await repo.getAll(paginationArgs);

			// Assert
			const callArgs = paginateMock.mock.calls[0]?.arguments[0] as {
				select?: Record<string, boolean>;
			};
			assert.deepStrictEqual(callArgs?.select, { _id: true, status: true });
		});

		test("Should pass sort through to paginator", async (t) => {
			// Arrange
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve(mockPaginatedResponse),
			);

			const paginationArgs: GetAllOrdersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				sort: { createdAt: "asc" },
			};

			// Act
			await repo.getAll(paginationArgs);

			// Assert
			const callArgs = paginateMock.mock.calls[0]?.arguments[0] as {
				sort?: Record<string, unknown>;
			};
			assert.deepStrictEqual(callArgs?.sort, { createdAt: "asc" });
		});
	});

	describe("getById", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should return the order object when 'db.findById' is called once with 'orderId'", async (t) => {
			// Arrange
			const findByIdMock = t.mock.method(OrderModel, "findById", () => ({
				lean: async () => mockOrder,
			}));

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.ok(order);
			assert.strictEqual(order.success, true);
			assert.deepStrictEqual(order.data, mockOrder);

			assert.strictEqual(findByIdMock.mock.callCount(), 1);
			assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], orderId);
		});

		test("Should return 'null' when 'db.findById' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(OrderModel, "findById", () => ({
				lean: async () => null,
			}));

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.ok(order);
			assert.strictEqual(order.success, true);
			assert.strictEqual(order.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(OrderModel, "findById", () => {
				throw validationError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(OrderModel, "findById", () => {
				throw timeoutError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(OrderModel, "findById", () => {
				throw queryError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(OrderModel, "findById", () => {
				throw networkError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(OrderModel, "findById", () => {
				throw unknownError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof GenericDatabaseError);
		});
	});

	describe("markAsProcessing", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();
		const paidAt = new Date();

		test("Should return the updated order when 'db.findByIdAndUpdate' is called once with correct params", async (t) => {
			// Arrange
			const findByIdAndUpdateMock = t.mock.method(
				OrderModel,
				"findByIdAndUpdate",
				() => ({
					lean: async () => mockOrder,
				}),
			);

			// Act
			const result = await repo.markAsProcessing({
				orderId,
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);

			assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				findByIdAndUpdateMock.mock.calls[0].arguments[0],
				orderId,
			);
			assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[1], {
				$set: {
					"payment.paidAt": paidAt,
					status: "processing",
				},
			});
			assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[2], {
				returnDocument: "after",
			});
		});

		test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(OrderModel, "findByIdAndUpdate", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.markAsProcessing({
				orderId,
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.markAsProcessing({
				orderId,
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.markAsProcessing({
				orderId,
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.markAsProcessing({
				orderId,
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.markAsProcessing({
				orderId,
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.markAsProcessing({
				orderId,
				paidAt,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("markAsCancelled", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();

		test("Should return the updated order when 'db.findByIdAndUpdate' is called once with correct params", async (t) => {
			// Arrange
			const findByIdAndUpdateMock = t.mock.method(
				OrderModel,
				"findByIdAndUpdate",
				() => ({
					lean: async () => mockOrder,
				}),
			);

			// Act
			const result = await repo.markAsCancelled({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);

			assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				findByIdAndUpdateMock.mock.calls[0].arguments[0],
				orderId,
			);
			assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[1], {
				$set: {
					status: "cancelled",
				},
			});
			assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[2], {
				returnDocument: "after",
			});
		});

		test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(OrderModel, "findByIdAndUpdate", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.markAsCancelled({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.markAsCancelled({ orderId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.markAsCancelled({ orderId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.markAsCancelled({ orderId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.markAsCancelled({ orderId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.markAsCancelled({ orderId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("updatePayment", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;
		const mockPaymentParams = {
			id: "pay_123",
			orderId,
			provider: "stripe" as const,
			sessionURL: "https://checkout.stripe.com/c/pay/cs_test_123",
		};

		test("Should update id, provider, and sessionURL when all three are provided", async (t) => {
			// Arrange
			const mockFindByIdAndUpdate = t.mock.method(
				OrderModel,
				"findByIdAndUpdate",
				() => ({
					lean: async () => mockOrder,
				}),
			);

			// Act
			const result = await repo.updatePayment(mockPaymentParams);

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(result.data, mockOrder);
			assert.strictEqual(mockFindByIdAndUpdate.mock.callCount(), 1);
			assert.deepStrictEqual(mockFindByIdAndUpdate.mock.calls[0].arguments[1], {
				$set: {
					"payment.id": mockPaymentParams.id,
					"payment.provider": mockPaymentParams.provider,
					"payment.sessionURL": mockPaymentParams.sessionURL,
				},
			});
		});

		test("Should update only 'payment.id' when only 'id' is provided", async (t) => {
			// Arrange
			const params = { id: "pay_123", orderId };
			const mockFindByIdAndUpdate = t.mock.method(
				OrderModel,
				"findByIdAndUpdate",
				() => ({
					lean: async () => mockOrder,
				}),
			);

			// Act
			const result = await repo.updatePayment(params);

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(mockFindByIdAndUpdate.mock.calls[0].arguments[1], {
				$set: {
					"payment.id": params.id,
				},
			});
		});

		test("Should update only 'payment.provider' when only 'provider' is provided", async (t) => {
			// Arrange
			const params = { orderId, provider: "stripe" as const };
			const mockFindByIdAndUpdate = t.mock.method(
				OrderModel,
				"findByIdAndUpdate",
				() => ({
					lean: async () => mockOrder,
				}),
			);

			// Act
			const result = await repo.updatePayment(params);

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(mockFindByIdAndUpdate.mock.calls[0].arguments[1], {
				$set: {
					"payment.provider": params.provider,
				},
			});
		});

		test("Should update 'payment.sessionURL' when sessionURL is provided", async (t) => {
			// Arrange
			const params = {
				orderId,
				sessionURL: "https://checkout.stripe.com/c/pay/cs_test_abc",
			};
			const mockFindByIdAndUpdate = t.mock.method(
				OrderModel,
				"findByIdAndUpdate",
				() => ({
					lean: async () => mockOrder,
				}),
			);

			// Act
			const result = await repo.updatePayment(params);

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(mockFindByIdAndUpdate.mock.calls[0].arguments[1], {
				$set: {
					"payment.sessionURL": params.sessionURL,
				},
			});
		});

		test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(OrderModel, "findByIdAndUpdate", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.updatePayment(mockPaymentParams);

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.updatePayment(mockPaymentParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.updatePayment(mockPaymentParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.updatePayment(mockPaymentParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.updatePayment(mockPaymentParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(OrderModel, "findByIdAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.updatePayment(mockPaymentParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});
});
