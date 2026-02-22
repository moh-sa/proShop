import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import {
	DatabaseBaseError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import { OrderService } from "../../services/index.js";
import {
	generateMockInsertOrder,
	generateMockInsertProductWithStringImage,
	generateMockObjectId,
	generateMockSelectOrder,
	generateMockSelectOrders,
	mockOrderRepository,
} from "../mocks/index.js";

suite("Order Service 〖 Unit Tests 〗", () => {
	const mockRepo = mockOrderRepository();
	const service = new OrderService(mockRepo);

	beforeEach(() => mockRepo.reset());

	describe("create", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockSelectOrder = generateMockSelectOrder(mockInsertOrder);

		test("Should return the order object when 'repo.create' is called once with order data", async () => {
			// Arrange
			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			// Act
			const order = await service.create(mockInsertOrder);

			// Assert
			assert.strictEqual(order.success, true);
			assert.deepStrictEqual(order.data, mockSelectOrder);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockInsertOrder,
			);
		});

		test("Should return 'ValidationError' if 'data.orderItems' length is '0'", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ orderItems: [] });

			// Act
			const result = await service.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if 'data' is invalid", async () => {
			// Arrange
			const mockInsertInvalidOrder = generateMockInsertProductWithStringImage();

			// Act
			// @ts-expect-error - test case
			const result = await service.create(mockInsertInvalidOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAll", () => {
		const mockOrders = generateMockSelectOrders(4);
		const mockMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: mockOrders.length,
			totalPages: 1,
		};

		const mockPaginatedResponse = {
			items: mockOrders,
			meta: mockMeta,
		};

		test("Should return paginated response when valid pagination parameters are provided", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			const paginationArgs = {
				pageNumber: "1",
			};

			// Act
			const result = await service.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockPaginatedResponse);
			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
		});

		test("Should return ValidationError when pageNumber is invalid", async () => {
			// Arrange
			const invalidArgs = {
				pageNumber: "invalid",
			};

			// Act
			const result = await service.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 0);
		});

		test("Should return ValidationError when pageSize is invalid", async () => {
			// Arrange
			const invalidArgs = {
				pageNumber: "1",
				pageSize: "invalid",
			};

			// Act
			const result = await service.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 0);
		});

		test("Should return ValidationError when sort parameter is invalid", async () => {
			// Arrange
			const invalidArgs = {
				pageNumber: "1",
				sort: 123,
			};

			// Act
			// @ts-expect-error - test case
			const result = await service.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 0);
		});

		test("Should return ValidationError when user parameter is invalid ObjectId", async () => {
			// Arrange
			const invalidArgs = {
				pageNumber: "1",
				user: "invalid-user-id",
			};

			// Act
			const result = await service.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 0);
		});

		test("Should return ValidationError when status parameter is invalid", async () => {
			// Arrange
			const invalidArgs = {
				pageNumber: "1",
				status: "invalid-status",
			};

			// Act
			const result = await service.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 0);
		});

		test("Should call repository with correct parameters when all validations pass", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);
			const userId = generateMockObjectId().toString();
			const pageNumber = "2";
			const pageSize = "5";
			const sort = "createdAt:desc";

			const paginationArgs = {
				pageNumber,
				pageSize,
				sort,
				status: "pending",
				user: userId,
			};

			// Act
			await service.getAll(paginationArgs);

			// Assert
			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);

			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].pageNumber,
				Number(pageNumber),
			);
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].pageSize,
				Number(pageSize),
			);

			assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0].sort, {
				createdAt: -1,
			});
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].query?.status,
				"pending",
			);
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].query.user.toString(),
				userId,
			);
		});

		test("Should return repository error when repository call fails", async () => {
			// Arrange
			const repositoryError = new DatabaseBaseError("Database error");
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: repositoryError, success: false }),
			);

			const paginationArgs = {
				pageNumber: "1",
			};

			// Act
			const result = await service.getAll(paginationArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, repositoryError);
		});
	});

	describe("getById", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();

		test("Should return order object when 'repo.getById' is called once with 'orderId'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const order = await service.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, true);
			assert.deepStrictEqual(order.data, mockOrder);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getById.mock.calls[0].arguments[0].orderId.toString(),
				orderId,
			);
		});

		test("Should return 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const order = await service.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'orderId' is invalid", async () => {
			// Arrange
			const invalidOrderId = "invalid-order-id";

			// Act
			const order = await service.getById({ orderId: invalidOrderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 0);
		});
	});

	describe("updateStatus", () => {
		const mockOrder = generateMockSelectOrder({ status: "pending" });
		const orderId = mockOrder._id.toString();

		test("Should return the updated order when a valid transition is performed", async () => {
			// Arrange
			const updatedOrder = { ...mockOrder, status: "processing" as const };

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);
			mockRepo.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: updatedOrder, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, updatedOrder);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.strictEqual(mockRepo.updateStatus.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.updateStatus.mock.calls[0].arguments[0].orderId.toString(),
				orderId,
			);
			assert.strictEqual(
				mockRepo.updateStatus.mock.calls[0].arguments[0].status,
				"processing",
			);
		});

		test("Should return the updated order when transitioning from 'pending' to 'cancelled'", async () => {
			// Arrange
			const cancelledOrder = { ...mockOrder, status: "cancelled" as const };

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);
			mockRepo.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: cancelledOrder, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId,
				status: "cancelled",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, cancelledOrder);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.strictEqual(mockRepo.updateStatus.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.updateStatus.mock.calls[0].arguments[0].status,
				"cancelled",
			);
		});

		test("Should return the updated order when transitioning from 'processing' to 'delivered'", async () => {
			// Arrange
			const processingOrder = generateMockSelectOrder({ status: "processing" });
			const deliveredOrder = {
				...processingOrder,
				status: "delivered" as const,
			};

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: processingOrder, success: true }),
			);
			mockRepo.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: deliveredOrder, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId: processingOrder._id.toString(),
				status: "delivered",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, deliveredOrder);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.strictEqual(mockRepo.updateStatus.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.updateStatus.mock.calls[0].arguments[0].status,
				"delivered",
			);
		});

		test("Should return 'ValidationError' when transition is not allowed (pending -> delivered)", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId,
				status: "delivered",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.strictEqual(mockRepo.updateStatus.mock.callCount(), 0);
		});

		test("Should return 'ValidationError' if 'orderId' is invalid", async () => {
			// Arrange
			const invalidOrderId = "invalid-order-id";

			// Act
			const result = await service.updateStatus({
				orderId: invalidOrderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 0);
			assert.strictEqual(mockRepo.updateStatus.mock.callCount(), 0);
		});

		test("Should return 'ValidationError' if 'status' value is invalid", async () => {
			// Act
			const result = await service.updateStatus({
				orderId,
				// @ts-expect-error - test case
				status: "invalid-status",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 0);
			assert.strictEqual(mockRepo.updateStatus.mock.callCount(), 0);
		});

		test("Should return 'NotFoundError' if order does not exist", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.strictEqual(mockRepo.updateStatus.mock.callCount(), 0);
		});

		test("Should return 'ValidationError' when transition is not allowed (delivered -> processing)", async () => {
			// Arrange
			const deliveredOrder = generateMockSelectOrder({ status: "delivered" });
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: deliveredOrder, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId: deliveredOrder._id.toString(),
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.ok(
				result.error.message.includes(
					"Cannot transition order from 'delivered' to 'processing'",
				),
			);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.strictEqual(mockRepo.updateStatus.mock.callCount(), 0);
		});

		test("Should return 'ValidationError' when transition is not allowed (cancelled -> processing)", async () => {
			// Arrange
			const cancelledOrder = generateMockSelectOrder({ status: "cancelled" });
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: cancelledOrder, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId: cancelledOrder._id.toString(),
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.ok(
				result.error.message.includes(
					"Cannot transition order from 'cancelled' to 'processing'",
				),
			);
		});

		test("Should return 'ValidationError' when transition is not allowed (processing -> cancelled)", async () => {
			// Arrange
			const processingOrder = generateMockSelectOrder({ status: "processing" });
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: processingOrder, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId: processingOrder._id.toString(),
				status: "cancelled",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.ok(
				result.error.message.includes(
					"Cannot transition order from 'processing' to 'cancelled'",
				),
			);
		});

		test("Should propagate repository error from 'repo.getById'", async () => {
			// Arrange
			const dbError = new DatabaseBaseError("Database error");
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: dbError, success: false }),
			);

			// Act
			const result = await service.updateStatus({
				orderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, dbError);
		});

		test("Should propagate repository error from 'repo.updateStatus'", async () => {
			// Arrange
			const dbError = new DatabaseBaseError("Database error");
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);
			mockRepo.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: dbError, success: false }),
			);

			// Act
			const result = await service.updateStatus({
				orderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, dbError);
		});

		test("Should return 'NotFoundError' if 'repo.updateStatus' returns null", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);
			mockRepo.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.updateStatus({
				orderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});
	});

	describe("updatePayment", () => {
		const mockOrder = generateMockSelectOrder({
			status: "processing",
			payment: undefined,
		});
		const orderId = mockOrder._id.toString();
		const paymentId = "cs_123";
		const provider = "stripe" as const;

		test("Should return updated payment fields when 'repo.updatePayment' is called with valid params", async () => {
			// Arrange
			const updatedOrder = {
				...mockOrder,
				payment: { id: paymentId, provider },
			};
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: updatedOrder, success: true }),
			);

			// Act
			const result = await service.updatePayment({
				orderId,
				id: paymentId,
				provider,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, updatedOrder);
		});

		test("Should call 'repo.updatePayment' once when only 'id' is provided", async () => {
			// Arrange
			const updatedOrder = {
				...mockOrder,
				payment: { id: paymentId, provider },
			};
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: updatedOrder, success: true }),
			);

			// Act
			await service.updatePayment({ orderId, id: paymentId });

			// Assert
			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 1);

			const args = mockRepo.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId.toString(), orderId);
			assert.strictEqual(args.id, paymentId);
			assert.strictEqual(args.provider, undefined);
		});

		test("Should call 'repo.updatePayment' once when only 'provider' is provided", async () => {
			// Arrange
			const updatedOrder = {
				...mockOrder,
				payment: { id: paymentId, provider },
			};
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: updatedOrder, success: true }),
			);

			// Act
			await service.updatePayment({ orderId, provider });

			// Assert
			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 1);

			const args = mockRepo.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId.toString(), orderId);
			assert.strictEqual(args.provider, provider);
			assert.strictEqual(args.id, undefined);
		});

		test("Should return 'ValidationError' when orderId is invalid", async () => {
			// Arrange
			const invalidOrderId = "invalid-order-id";

			// Act
			const result = await service.updatePayment({
				orderId: invalidOrderId,
				id: paymentId,
				provider,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 0);
		});

		test("Should return 'ValidationError' when provider is invalid", async () => {
			// Act
			const result = await service.updatePayment({
				orderId,
				id: paymentId,
				// @ts-expect-error - test case
				provider: "PayPal",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 0);
		});

		test("Should return 'ValidationError' when id is empty string", async () => {
			// Act
			const result = await service.updatePayment({
				orderId,
				id: "",
				provider,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 0);
		});

		test("Should return 'NotFoundError' when repository returns null", async () => {
			// Arrange
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.updatePayment({
				orderId,
				id: paymentId,
				provider,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should propagate repository error when repository call fails", async () => {
			// Arrange
			const error = new DatabaseBaseError("Database error");
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: error, success: false }),
			);

			// Act
			const result = await service.updatePayment({
				orderId,
				id: paymentId,
				provider,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});
	});
});
