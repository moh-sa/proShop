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
		const mockSelectOrder = generateMockSelectOrder();
		mockSelectOrder.user._id = mockInsertOrder.user;

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

		test("Should set 'PaymentMethod' to 'PayPal' if not provided when 'service.create' is called", async () => {
			// Arrange
			const mockInsertOrder = generateMockInsertOrder({
				paymentMethod: undefined,
			});
			const mockSelectOrder = generateMockSelectOrder({
				paymentMethod: "PayPal",
			});

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			// Act
			const order = await service.create(mockInsertOrder);

			// Assert
			assert.strictEqual(order.success, true);
			assert.strictEqual(order.data.paymentMethod, "PayPal");
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

		test("Should return ValidationError when isPaid parameter is invalid boolean", async () => {
			// Arrange
			const invalidArgs = {
				isPaid: "invalid-boolean",
				pageNumber: "1",
			};

			// Act
			const result = await service.getAll(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 0);
		});

		test("Should return ValidationError when isDelivered parameter is invalid boolean", async () => {
			// Arrange
			const invalidArgs = {
				isDelivered: "invalid-boolean",
				pageNumber: "1",
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
				isDelivered: "false",
				isPaid: "true",
				pageNumber,
				pageSize,
				sort,
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
				mockRepo.getAll.mock.calls[0].arguments[0].query?.isDelivered,
				false,
			);
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].query.isPaid,
				true,
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

	describe("updateToPaid", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();

		test("Should return the order object when 'repo.updateToPaid' is called once with 'orderId'", async () => {
			// Arrange
			mockRepo.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const updatedOrder = await service.updateToPaid({
				orderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.deepStrictEqual(updatedOrder.data, mockOrder);

			assert.strictEqual(mockRepo.updateToPaid.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.updateToPaid.mock.calls[0].arguments[0].orderId.toString(),
				orderId,
			);
		});

		test("Should return 'NotFoundError' if 'repo.updateToPaid' returns 'null'", async () => {
			// Arrange
			mockRepo.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const updatedOrder = await service.updateToPaid({
				orderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'orderId' is invalid", async () => {
			// Arrange
			const invalidOrderId = "invalid-order-id";

			// Act
			const updatedOrder = await service.updateToPaid({
				orderId: invalidOrderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof ValidationError);

			assert.strictEqual(mockRepo.updateToPaid.mock.callCount(), 0);
		});
	});

	describe("updateToDelivered", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();

		test("Should return the order object when 'repo.updateToDelivered' is called once with 'orderId", async () => {
			// Arrange
			mockRepo.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const updatedOrder = await service.updateToDelivered({
				orderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.deepStrictEqual(updatedOrder.data, mockOrder);

			assert.strictEqual(mockRepo.updateToDelivered.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.updateToDelivered.mock.calls[0].arguments[0].orderId.toString(),
				orderId,
			);
		});

		test("Should return 'NotFoundError' if 'repo.updateToDelivered' returns 'null'", async () => {
			// Arrange
			mockRepo.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const updatedOrder = await service.updateToDelivered({
				orderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'orderId' is invalid", async () => {
			// Arrange
			const invalidOrderId = "invalid-order-id";

			// Act & Assert
			const updatedOrder = await service.updateToDelivered({
				orderId: invalidOrderId,
			});

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof ValidationError);

			assert.strictEqual(mockRepo.updateToDelivered.mock.callCount(), 0);
		});
	});
});
