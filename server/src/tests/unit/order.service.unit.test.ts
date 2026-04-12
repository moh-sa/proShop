import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import {
	DatabaseBaseError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import { OrderService } from "../../services/index.js";
import { GetAllOrdersServiceParams } from "../../types/order.type.js";
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
		const orderServiceGetAllSelect = {
			id: true,
			createdAt: true,
			deliveredAt: true,
			"payment.paidAt": true,
			status: true,
			totalPrice: true,
			"user.id": true,
			"user.email": true,
			"user.name": true,
		} as const;

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

			const paginationArgs: GetAllOrdersServiceParams = {
				pageNumber: "1",
				pageSize: "10",
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
			const invalidArgs: GetAllOrdersServiceParams = {
				pageNumber: "invalid",
				pageSize: "10",
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
			const invalidArgs: GetAllOrdersServiceParams = {
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
			const invalidArgs: GetAllOrdersServiceParams = {
				pageNumber: "1",
				pageSize: "10",
				// @ts-expect-error - test case
				sort: 123,
			};

			// Act
			const result = await service.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 0);
		});

		test("Should return ValidationError when user parameter is invalid ObjectId", async () => {
			// Arrange
			const invalidArgs: GetAllOrdersServiceParams = {
				pageNumber: "1",
				pageSize: "10",
				filters: {
					userId: "invalid-user-id",
				},
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
			const invalidArgs: GetAllOrdersServiceParams = {
				pageNumber: "1",
				pageSize: "10",
				filters: {
					status: "invalid-status",
				},
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
			const userId = generateMockObjectId();
			const pageNumber = "2";
			const pageSize = "5";
			const sort = "createdAt:desc";

			const paginationArgs: GetAllOrdersServiceParams = {
				pageNumber,
				pageSize,
				sort,
				filters: {
					status: "pending",
					userId: userId,
				},
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
				createdAt: "desc",
			});
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].filters?.status,
				"pending",
			);
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].filters.userId,
				userId,
			);
			assert.deepStrictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].select,
				orderServiceGetAllSelect,
			);
		});

		test("Should return repository error when repository call fails", async () => {
			// Arrange
			const repositoryError = new DatabaseBaseError("Database error");
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: repositoryError, success: false }),
			);

			const paginationArgs: GetAllOrdersServiceParams = {
				pageNumber: "1",
				pageSize: "10",
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
		const orderId = mockOrder.id;

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
				mockRepo.getById.mock.calls[0].arguments[0].orderId,
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

	describe("markAsProcessing", () => {
		const validParams = {
			orderId: generateMockObjectId(),
			paidAt: new Date(),
		};

		test("Should return order object when repo.markAsProcessing returns success with data", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ status: "processing" });
			mockRepo.markAsProcessing.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const result = await service.markAsProcessing(validParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);
			assert.strictEqual(mockRepo.markAsProcessing.mock.callCount(), 1);
		});

		test("Should call repository with validated params when validation passes", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ status: "processing" });
			mockRepo.markAsProcessing.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			await service.markAsProcessing(validParams);

			// Assert
			const args = mockRepo.markAsProcessing.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId, validParams.orderId);
			assert.strictEqual(args.paidAt.getTime(), validParams.paidAt.getTime());
		});

		test("Should return ValidationError when orderId is invalid", async () => {
			// Arrange
			const invalidParams = {
				...validParams,
				orderId: "invalid-id",
			};

			// Act
			const result = await service.markAsProcessing(invalidParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.markAsProcessing.mock.callCount(), 0);
		});

		test("Should return ValidationError when orderId is missing", async () => {
			// Arrange
			const invalidParams = {
				paidAt: validParams.paidAt,
			};

			// Act
			// @ts-expect-error - test case
			const result = await service.markAsProcessing(invalidParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.markAsProcessing.mock.callCount(), 0);
		});

		test("Should return ValidationError when paidAt is missing", async () => {
			// Arrange
			const invalidParams = {
				orderId: validParams.orderId,
			};

			// Act
			// @ts-expect-error - test case
			const result = await service.markAsProcessing(invalidParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.markAsProcessing.mock.callCount(), 0);
		});

		test("Should return ValidationError when paidAt is not a Date", async () => {
			// Arrange
			const invalidParams = {
				...validParams,
				paidAt: "2024-01-01",
			};

			// Act
			// @ts-expect-error - test case
			const result = await service.markAsProcessing(invalidParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.markAsProcessing.mock.callCount(), 0);
		});

		test("Should return NotFoundError when repo returns null", async () => {
			// Arrange
			mockRepo.markAsProcessing.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.markAsProcessing(validParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return repository error when repo returns failure", async () => {
			// Arrange
			const repositoryError = new DatabaseBaseError("Database error");
			mockRepo.markAsProcessing.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: repositoryError, success: false }),
			);

			// Act
			const result = await service.markAsProcessing(validParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, repositoryError);
		});
	});

	describe("markAsCancelled", () => {
		const validParams = {
			orderId: generateMockObjectId(),
		};
		const invalidParams = {
			orderId: "invalid-id",
		};

		test("Should return order object when repo.markAsCancelled returns success with data", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ status: "cancelled" });
			mockRepo.markAsCancelled.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const result = await service.markAsCancelled(validParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);
			assert.strictEqual(mockRepo.markAsCancelled.mock.callCount(), 1);
		});

		test("Should call repository with validated params when validation passes", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ status: "cancelled" });
			mockRepo.markAsCancelled.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			await service.markAsCancelled(validParams);

			// Assert
			const args = mockRepo.markAsCancelled.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId, validParams.orderId);
		});

		test("Should return ValidationError when orderId is invalid", async () => {
			// Act
			const result = await service.markAsCancelled(invalidParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.markAsCancelled.mock.callCount(), 0);
		});

		test("Should return ValidationError when orderId is missing", async () => {
			// Arrange
			const invalidParams = {};

			// Act
			// @ts-expect-error - test case
			const result = await service.markAsCancelled(invalidParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.strictEqual(mockRepo.markAsCancelled.mock.callCount(), 0);
		});

		test("Should return NotFoundError when repo returns null", async () => {
			// Arrange
			mockRepo.markAsCancelled.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.markAsCancelled(validParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return repository error when repo returns failure", async () => {
			// Arrange
			const repositoryError = new DatabaseBaseError("Database error");
			mockRepo.markAsCancelled.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: repositoryError, success: false }),
			);

			// Act
			const result = await service.markAsCancelled(validParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, repositoryError);
		});
	});

	describe("updatePayment", () => {
		const mockOrder = generateMockSelectOrder({
			status: "processing",
			payment: undefined,
		});
		const orderId = mockOrder.id;
		const paymentId = "cs_123";
		const provider = "stripe" as const;
		const sessionURL = "https://checkout.stripe.com/c/pay/cs_test_123";

		test("Should return updated payment fields when 'repo.updatePayment' is called with valid params", async () => {
			// Arrange
			const updatedOrder = {
				...mockOrder,
				payment: { id: paymentId, paidAt: new Date(), provider, sessionURL },
			};
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: updatedOrder, success: true }),
			);

			// Act
			const result = await service.updatePayment({
				orderId,
				id: paymentId,
				provider,
				sessionURL,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, updatedOrder);
			assert.strictEqual(result.data.payment?.sessionURL, sessionURL);
		});

		test("Should call 'repo.updatePayment' once when only 'id' is provided", async () => {
			// Arrange
			const updatedOrder = {
				...mockOrder,
				payment: { id: paymentId, paidAt: new Date(), provider, sessionURL },
			};
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: updatedOrder, success: true }),
			);

			// Act
			await service.updatePayment({ orderId, id: paymentId });

			// Assert
			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 1);

			const args = mockRepo.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId, orderId);
			assert.strictEqual(args.id, paymentId);
			assert.strictEqual(args.provider, undefined);
		});

		test("Should call 'repo.updatePayment' once when only 'provider' is provided", async () => {
			// Arrange
			const updatedOrder = {
				...mockOrder,
				payment: { id: paymentId, paidAt: new Date(), provider, sessionURL },
			};
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: updatedOrder, success: true }),
			);

			// Act
			await service.updatePayment({ orderId, provider });

			// Assert
			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 1);

			const args = mockRepo.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId, orderId);
			assert.strictEqual(args.provider, provider);
			assert.strictEqual(args.id, undefined);
		});

		test("Should call 'repo.updatePayment' with sessionURL when sessionURL is provided", async () => {
			// Arrange
			const updatedOrder = {
				...mockOrder,
				payment: { id: paymentId, paidAt: new Date(), provider, sessionURL },
			};
			mockRepo.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: updatedOrder, success: true }),
			);

			// Act
			await service.updatePayment({
				orderId,
				id: paymentId,
				provider,
				sessionURL,
			});

			// Assert
			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 1);

			const args = mockRepo.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId, orderId);
			assert.strictEqual(args.id, paymentId);
			assert.strictEqual(args.provider, provider);
			assert.strictEqual(args.sessionURL, sessionURL);
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

		test("Should return 'ValidationError' when sessionURL is invalid", async () => {
			// Act
			const result = await service.updatePayment({
				orderId,
				id: paymentId,
				provider,
				sessionURL: "invalid_url",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.updatePayment.mock.callCount(), 0);
		});

		test("Should return 'ValidationError' when sessionURL is empty string", async () => {
			// Act
			const result = await service.updatePayment({
				orderId,
				id: paymentId,
				provider,
				sessionURL: "",
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
