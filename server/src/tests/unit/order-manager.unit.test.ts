import assert from "node:assert/strict";
import test, { beforeEach, describe, suite } from "node:test";

import { faker } from "@faker-js/faker";

import { OrderManager } from "../../managers/order.manager.js";
import {
	generateMockInsertOrder,
	generateMockSelectOrder,
	generateMockSelectOrders,
	mockOrderService,
	mockPaymentService,
} from "../mocks/index.js";

suite("Order Manager 〖 Unit Tests 〗", () => {
	const mockOrderSvc = mockOrderService();
	const mockPaymentSvc = mockPaymentService();
	const manager = new OrderManager(mockOrderSvc, mockPaymentSvc);

	beforeEach(() => {
		mockOrderSvc.reset();
		mockPaymentSvc.reset();
	});

	describe("create", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockSelectOrder = generateMockSelectOrder();
		const mockCheckoutUrl = faker.internet.url();
		const mockCheckoutSessionId = `cs_${faker.string.alphanumeric(24)}`;

		test("should return success with order and checkoutUrl when order and checkout session are created successfully", async () => {
			// Arrange
			mockOrderSvc.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);
			mockPaymentSvc.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { id: mockCheckoutSessionId, url: mockCheckoutUrl },
					success: true,
				}),
			);

			// Act
			const result = await manager.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.session.url, mockCheckoutUrl);
			assert.deepStrictEqual(result.data.order, mockSelectOrder);

			assert.strictEqual(mockOrderSvc.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockOrderSvc.create.mock.calls[0].arguments[0],
				mockInsertOrder,
			);

			assert.strictEqual(
				mockPaymentSvc.createCheckoutSession.mock.callCount(),
				1,
			);
		});

		test("should return error when order service creation fails", async () => {
			// Arrange
			const createError = new Error("Database error");
			mockOrderSvc.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: createError, success: false }),
			);

			// Act
			const result = await manager.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, createError);

			assert.strictEqual(mockOrderSvc.create.mock.callCount(), 1);
			assert.strictEqual(
				mockPaymentSvc.createCheckoutSession.mock.callCount(),
				0,
			);
		});

		test("should return error when checkout session creation fails", async () => {
			// Arrange
			const checkoutError = new Error("Stripe error");
			mockOrderSvc.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);
			mockPaymentSvc.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: checkoutError, success: false }),
			);

			// Act
			const result = await manager.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, checkoutError);

			assert.strictEqual(mockOrderSvc.create.mock.callCount(), 1);
			assert.strictEqual(
				mockPaymentSvc.createCheckoutSession.mock.callCount(),
				1,
			);
		});

		test("should correctly transform order items to checkout line items", async () => {
			// Arrange
			const orderWithItems = generateMockSelectOrder({
				orderItemsCount: 2,
			});

			mockOrderSvc.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: orderWithItems, success: true }),
			);
			mockPaymentSvc.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { id: mockCheckoutSessionId, url: mockCheckoutUrl },
					success: true,
				}),
			);

			// Act
			await manager.create(mockInsertOrder);

			// Assert
			const checkoutCallArgs =
				mockPaymentSvc.createCheckoutSession.mock.calls[0].arguments[0];

			// Verify line items transformation
			assert.strictEqual(
				checkoutCallArgs.items.length,
				orderWithItems.orderItems.length,
			);

			// Verify each line item has correct structure
			for (let i = 0; i < orderWithItems.orderItems.length; i++) {
				const orderItem = orderWithItems.orderItems[i];
				const lineItem = checkoutCallArgs.items[i];

				assert.strictEqual(lineItem.imageUrl, orderItem.image);
				assert.strictEqual(lineItem.name, orderItem.name);
				assert.strictEqual(lineItem.quantity, orderItem.qty);
				assert.strictEqual(lineItem.unitAmount, orderItem.price);
			}
		});
	});

	describe("getAll", () => {
		const mockOrders = generateMockSelectOrders(4);
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

		test("should return paginated response when order service succeeds", async () => {
			// Arrange
			const args = { pageNumber: "1" };
			mockOrderSvc.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			const result = await manager.getAll(args);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockPaginatedResponse);

			assert.strictEqual(mockOrderSvc.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockOrderSvc.getAll.mock.calls[0].arguments[0],
				args,
			);
		});

		test("should pass through all arguments to order service", async () => {
			// Arrange
			const args = { pageNumber: "2", pageSize: "5", sort: "createdAt:desc" };
			mockOrderSvc.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await manager.getAll(args);

			// Assert
			assert.strictEqual(mockOrderSvc.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockOrderSvc.getAll.mock.calls[0].arguments[0],
				args,
			);
		});
	});

	describe("getById", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();

		test("should return order when order service succeeds", async () => {
			// Arrange
			mockOrderSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const result = await manager.getById({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);

			assert.strictEqual(mockOrderSvc.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockOrderSvc.getById.mock.calls[0].arguments[0], {
				orderId,
			});
		});

		test("should pass through error from order service", async () => {
			// Arrange
			const notFoundError = new Error("Order not found");
			mockOrderSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: notFoundError, success: false }),
			);

			// Act
			const result = await manager.getById({ orderId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, notFoundError);
		});
	});

	describe("processPaymentWebhook", () => {
		const mockWebhookParams = {
			payload: Buffer.from(
				JSON.stringify({ type: "checkout.session.completed" }),
			),
			signature: `t=${Date.now()},v1=${faker.string.hexadecimal({ length: 64 })}`,
		};
		const mockOrderId = faker.database.mongodbObjectId();
		const mockUpdatedOrder = generateMockSelectOrder({
			isPaid: true,
			paidAt: new Date(),
		});

		test("should return error when webhook verification fails", async () => {
			// Arrange
			const verifyError = new Error("Invalid webhook signature");
			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				error: verifyError,
				success: false,
			}));

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, verifyError);

			assert.strictEqual(mockPaymentSvc.verifyWebhook.mock.callCount(), 1);
			assert.strictEqual(mockOrderSvc.updateToPaid.mock.callCount(), 0);
		});

		test("should update order to paid and return success for checkout.session.completed event", async () => {
			// Arrange
			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: mockOrderId },
					type: "checkout.session.completed",
				},
				success: true,
			}));
			mockOrderSvc.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUpdatedOrder, success: true }),
			);

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(mockPaymentSvc.verifyWebhook.mock.callCount(), 1);
			assert.strictEqual(mockOrderSvc.updateToPaid.mock.callCount(), 1);
			assert.strictEqual(
				mockOrderSvc.updateToPaid.mock.calls[0].arguments[0].orderId,
				mockOrderId,
			);
		});

		test("should return error when updateToPaid fails for checkout.session.completed event", async () => {
			// Arrange
			const updateError = new Error("Failed to update order");
			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: mockOrderId },
					type: "checkout.session.completed",
				},
				success: true,
			}));
			mockOrderSvc.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: updateError, success: false }),
			);

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, updateError);

			assert.strictEqual(mockOrderSvc.updateToPaid.mock.callCount(), 1);
		});

		test("should return success for checkout.session.expired event without updating order", async () => {
			// Arrange
			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: mockOrderId },
					type: "checkout.session.expired",
				},
				success: true,
			}));

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(mockPaymentSvc.verifyWebhook.mock.callCount(), 1);
			assert.strictEqual(mockOrderSvc.updateToPaid.mock.callCount(), 0);
		});

		test("should return success for unhandled event types", async () => {
			// Arrange
			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: mockOrderId },
					type: "payment_intent.succeeded",
				},
				success: true,
			}));

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(mockPaymentSvc.verifyWebhook.mock.callCount(), 1);
			assert.strictEqual(mockOrderSvc.updateToPaid.mock.callCount(), 0);
		});
	});

	describe("updateToDelivered", () => {
		const mockOrder = generateMockSelectOrder({
			isDelivered: true,
			deliveredAt: new Date(),
		});
		const orderId = mockOrder._id.toString();

		test("should return updated order when order service succeeds", async () => {
			// Arrange
			mockOrderSvc.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const result = await manager.updateToDelivered({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);

			assert.strictEqual(mockOrderSvc.updateToDelivered.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockOrderSvc.updateToDelivered.mock.calls[0].arguments[0],
				{ orderId },
			);
		});

		test("should pass through error from order service", async () => {
			// Arrange
			const updateError = new Error("Order not found");
			mockOrderSvc.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: updateError, success: false }),
			);

			// Act
			const result = await manager.updateToDelivered({ orderId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, updateError);
		});
	});

	describe("updateToPaid", () => {
		const mockOrder = generateMockSelectOrder({
			isPaid: true,
			paidAt: new Date(),
		});
		const orderId = mockOrder._id.toString();

		test("should return updated order when order service succeeds", async () => {
			// Arrange
			mockOrderSvc.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const result = await manager.updateToPaid({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);

			assert.strictEqual(mockOrderSvc.updateToPaid.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockOrderSvc.updateToPaid.mock.calls[0].arguments[0],
				{ orderId },
			);
		});

		test("should pass through error from order service", async () => {
			// Arrange
			const updateError = new Error("Order not found");
			mockOrderSvc.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: updateError, success: false }),
			);

			// Act
			const result = await manager.updateToPaid({ orderId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, updateError);
		});
	});
});
