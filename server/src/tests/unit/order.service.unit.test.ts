import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import { NotFoundError, ValidationError } from "../../errors/index.js";
import { OrderService } from "../../services/index.js";
import {
	generateMockInsertOrder,
	generateMockInsertProductWithStringImage,
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

		test("Should return array of orders when 'repo.getAll' is called once with no args", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			// Act
			const orders = await service.getAll();

			// Assert
			assert.strictEqual(orders.success, true);
			assert.deepStrictEqual(orders.data, mockOrders);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should return empty array if 'repo.getAll' returns empty array", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			// Act
			const orders = await service.getAll();

			// Assert
			assert.strictEqual(orders.success, true);
			assert.strictEqual(orders.data.length, 0);
		});
	});

	describe("getAllByUserId", () => {
		const mockOrders = generateMockSelectOrders(4);
		const userId = mockOrders[0].user._id;

		test("Should return array of orders when 'repo.getAllByUserId' is called once with 'userId'", async () => {
			// Arrange
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			// Act
			const orders = await service.getAllByUserId({
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(orders.success, true);
			assert.deepStrictEqual(orders.data, mockOrders);

			assert.strictEqual(mockRepo.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getAllByUserId.mock.calls[0].arguments[0],
				{ userId },
			);
		});

		test("Should return empty array if 'repo.getAllByUserId' returns empty array", async () => {
			// Arrange
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			// Act
			const orders = await service.getAllByUserId({
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(orders.success, true);
			assert.strictEqual(orders.data.length, 0);
		});

		test("Should return 'ValidationError' if 'userId' is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-user-id";

			// Act
			const result = await service.getAllByUserId({ userId: invalidUserId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAllByUserId.mock.callCount(), 0);
		});
	});

	describe("getById", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should return order object when 'repo.getById' is called once with 'orderId'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const order = await service.getById({ orderId: orderId.toString() });

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
			const order = await service.getById({ orderId: orderId.toString() });

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
		const orderId = mockOrder._id;

		test("Should return the order object when 'repo.updateToPaid' is called once with 'orderId'", async () => {
			// Arrange
			mockRepo.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const updatedOrder = await service.updateToPaid({
				orderId: orderId.toString(),
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.deepStrictEqual(updatedOrder.data, mockOrder);

			assert.strictEqual(mockRepo.updateToPaid.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.updateToPaid.mock.calls[0].arguments[0].orderId,
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
				orderId: orderId.toString(),
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
		const orderId = mockOrder._id;

		test("Should return the order object when 'repo.updateToDelivered' is called once with 'orderId", async () => {
			// Arrange
			mockRepo.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const updatedOrder = await service.updateToDelivered({
				orderId: orderId.toString(),
			});

			// Assert
			assert.strictEqual(updatedOrder.success, true);
			assert.deepStrictEqual(updatedOrder.data, mockOrder);

			assert.strictEqual(mockRepo.updateToDelivered.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.updateToDelivered.mock.calls[0].arguments[0].orderId,
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
				orderId: orderId.toString(),
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
