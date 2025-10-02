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
			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			const order = await service.create(mockInsertOrder);

			assert.ok(order);
			assert.deepStrictEqual(order, mockSelectOrder);

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
			assert.strictEqual(order.paymentMethod, "PayPal");
		});

		test("Should throw 'ValidationError' if 'data.orderItems' length is '0'", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ orderItems: [] });

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockOrder),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'data' is invalid", async () => {
			// Arrange
			const mockInsertInvalidOrder = generateMockInsertProductWithStringImage();

			// Act & Assert
			await assert.rejects(
				// @ts-expect-error - testing invalid order data
				async () => await service.create(mockInsertInvalidOrder),
				ValidationError,
			);
		});
	});

	describe("getAll", () => {
		const mockOrders = generateMockSelectOrders(4);

		test("Should return array of orders when 'repo.getAll' is called once with no args", async () => {
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			const orders = await service.getAll();

			assert.ok(orders);
			assert.deepStrictEqual(orders, mockOrders);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should return empty array if 'repo.getAll' returns empty array", async () => {
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			const orders = await service.getAll();

			assert.ok(orders);
			assert.strictEqual(orders.length, 0);
		});
	});

	describe("getAllByUserId", () => {
		const mockOrders = generateMockSelectOrders(4);
		const userId = mockOrders[0].user._id;

		test("Should return array of orders when 'repo.getAllByUserId' is called once with 'userId'", async () => {
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			const orders = await service.getAllByUserId({
				userId: userId.toString(),
			});

			assert.ok(orders);
			assert.deepStrictEqual(orders, mockOrders);

			assert.strictEqual(mockRepo.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getAllByUserId.mock.calls[0].arguments[0],
				{ userId },
			);
		});

		test("Should return empty array if 'repo.getAllByUserId' returns empty array", async () => {
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			const orders = await service.getAllByUserId({
				userId: userId.toString(),
			});

			assert.ok(orders);
			assert.strictEqual(orders.length, 0);
		});

		test("Should throw 'ValidationError' if 'userId' is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-user-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.getAllByUserId({ userId: invalidUserId }),
				ValidationError,
			);
		});
	});

	describe("getById", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should return order object when 'repo.getById' is called once with 'orderId'", async () => {
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			const order = await service.getById({ orderId: orderId.toString() });

			assert.ok(order);
			assert.deepStrictEqual(order, mockOrder);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
				orderId,
			});
		});

		test("Should throw 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () => await service.getById({ orderId: orderId.toString() }),
				NotFoundError,
			);
		});

		test("Should throw 'ValidationError' if 'orderId' is invalid", async () => {
			// Arrange
			const invalidOrderId = "invalid-order-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.getById({ orderId: invalidOrderId }),
				ValidationError,
			);
		});
	});

	describe("updateToPaid", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should return the order object when 'repo.updateToPaid' is called once with 'orderId'", async () => {
			mockRepo.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			const updatedOrder = await service.updateToPaid({
				orderId: orderId.toString(),
			});

			assert.ok(updatedOrder);
			assert.deepStrictEqual(updatedOrder, mockOrder);

			assert.strictEqual(mockRepo.updateToPaid.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.updateToPaid.mock.calls[0].arguments[0], {
				orderId,
			});
		});

		test("Should throw 'NotFoundError' if 'repo.updateToPaid' returns 'null'", async () => {
			mockRepo.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () => await service.updateToPaid({ orderId: orderId.toString() }),
				NotFoundError,
			);
		});

		test("Should throw 'ValidationError' if 'orderId' is invalid", async () => {
			// Arrange
			const invalidOrderId = "invalid-order-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.updateToPaid({ orderId: invalidOrderId }),
				ValidationError,
			);
		});
	});

	describe("updateToDelivered", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should return the order object when 'repo.updateToDelivered' is called once with 'orderId", async () => {
			mockRepo.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			const updatedOrder = await service.updateToDelivered({
				orderId: orderId.toString(),
			});

			assert.ok(updatedOrder);
			assert.deepStrictEqual(updatedOrder, mockOrder);

			assert.strictEqual(mockRepo.updateToDelivered.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.updateToDelivered.mock.calls[0].arguments[0],
				{ orderId },
			);
		});

		test("Should throw 'NotFoundError' if 'repo.updateToDelivered' returns 'null'", async () => {
			mockRepo.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () =>
					await service.updateToDelivered({ orderId: orderId.toString() }),
				NotFoundError,
			);
		});

		test("Should throw 'ValidationError' if 'orderId' is invalid", async () => {
			// Arrange
			const invalidOrderId = "invalid-order-id";

			// Act & Assert
			await assert.rejects(
				async () =>
					await service.updateToDelivered({ orderId: invalidOrderId }),
				ValidationError,
			);
		});
	});
});
