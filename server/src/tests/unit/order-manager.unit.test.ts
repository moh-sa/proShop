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
			mockOrderSvc.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
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

		test("should call updatePayment with checkout session id, orderId, and provider after checkout session is created", async () => {
			// Arrange
			const orderId = mockSelectOrder._id.toString();
			mockOrderSvc.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);
			mockPaymentSvc.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { id: mockCheckoutSessionId, url: mockCheckoutUrl },
					success: true,
				}),
			);
			mockOrderSvc.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			// Act
			await manager.create(mockInsertOrder);

			// Assert
			assert.strictEqual(mockOrderSvc.updatePayment.mock.callCount(), 1);

			const args = mockOrderSvc.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.id, mockCheckoutSessionId);
			assert.strictEqual(args.orderId, orderId);
			assert.strictEqual(args.provider, "stripe");
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

		test("should return success even when updatePayment fails", async () => {
			// Arrange
			const updatePaymentError = new Error("Failed to store session");
			mockOrderSvc.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);
			mockPaymentSvc.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { id: mockCheckoutSessionId, url: mockCheckoutUrl },
					success: true,
				}),
			);
			mockOrderSvc.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: updatePaymentError,
					success: false,
				}),
			);

			// Act
			const result = await manager.create(mockInsertOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.session.url, mockCheckoutUrl);
			assert.deepStrictEqual(result.data.order, mockSelectOrder);
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
			mockOrderSvc.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: orderWithItems, success: true }),
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
			status: "processing",
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
			assert.strictEqual(mockOrderSvc.updateStatus.mock.callCount(), 0);
		});

		test("should update order status to 'processing' and return success for checkout.session.completed event", async () => {
			// Arrange
			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: mockOrderId },
					type: "checkout.session.completed",
				},
				success: true,
			}));
			mockOrderSvc.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUpdatedOrder, success: true }),
			);

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(mockPaymentSvc.verifyWebhook.mock.callCount(), 1);
			assert.strictEqual(mockOrderSvc.updateStatus.mock.callCount(), 1);
			assert.strictEqual(
				mockOrderSvc.updateStatus.mock.calls[0].arguments[0].orderId,
				mockOrderId,
			);
			assert.strictEqual(
				mockOrderSvc.updateStatus.mock.calls[0].arguments[0].status,
				"processing",
			);
		});

		test("should return error when updateStatus fails for checkout.session.completed event", async () => {
			// Arrange
			const updateError = new Error("Failed to update order");
			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: mockOrderId },
					type: "checkout.session.completed",
				},
				success: true,
			}));
			mockOrderSvc.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: updateError, success: false }),
			);

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, updateError);

			assert.strictEqual(mockOrderSvc.updateStatus.mock.callCount(), 1);
		});

		test("should update order status to 'cancelled' for checkout.session.expired event", async () => {
			// Arrange
			const mockCancelledOrder = generateMockSelectOrder({
				status: "cancelled",
			});

			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: mockOrderId },
					type: "checkout.session.expired",
				},
				success: true,
			}));
			mockOrderSvc.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCancelledOrder, success: true }),
			);

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(mockOrderSvc.updateStatus.mock.callCount(), 1);
			assert.strictEqual(
				mockOrderSvc.updateStatus.mock.calls[0].arguments[0].orderId,
				mockOrderId,
			);
			assert.strictEqual(
				mockOrderSvc.updateStatus.mock.calls[0].arguments[0].status,
				"cancelled",
			);
		});

		test("should return error when updateStatus fails for checkout.session.expired event", async () => {
			// Arrange
			const updateError = new Error("Failed to cancel order");
			mockPaymentSvc.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: mockOrderId },
					type: "checkout.session.expired",
				},
				success: true,
			}));
			mockOrderSvc.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: updateError, success: false }),
			);

			// Act
			const result = await manager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, updateError);
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
			assert.strictEqual(mockOrderSvc.updateStatus.mock.callCount(), 0);
		});
	});

	describe("updateStatus", () => {
		const mockOrder = generateMockSelectOrder({
			status: "processing",
			paidAt: new Date(),
		});
		const orderId = mockOrder._id.toString();

		test("should return updated order when order service succeeds", async () => {
			// Arrange
			mockOrderSvc.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const result = await manager.updateStatus({
				orderId,
				status: "delivered",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);

			assert.strictEqual(mockOrderSvc.updateStatus.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockOrderSvc.updateStatus.mock.calls[0].arguments[0],
				{ orderId, status: "delivered" },
			);
		});

		test("should pass through error from order service", async () => {
			// Arrange
			const updateError = new Error("Order not found");
			mockOrderSvc.updateStatus.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: updateError, success: false }),
			);

			// Act
			const result = await manager.updateStatus({
				orderId,
				status: "delivered",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, updateError);
		});
	});

	describe("updatePayment", () => {
		const mockOrder = generateMockSelectOrder({
			status: "processing",
			payment: undefined,
		});
		const orderId = mockOrder._id.toString();

		test("should return updated order when order service succeeds", async () => {
			// Arrange
			const params = {
				orderId,
				id: "cs_123",
				provider: "stripe" as const,
				sessionURL: "https://checkout.stripe.com/c/pay/cs_456",
			};

			mockOrderSvc.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			const result = await manager.updatePayment(params);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockOrder);

			assert.strictEqual(mockOrderSvc.updatePayment.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockOrderSvc.updatePayment.mock.calls[0].arguments[0],
				params,
			);
		});

		test("should pass sessionURL to order service when sessionURL is provided", async () => {
			// Arrange
			const sessionURL = "https://checkout.stripe.com/c/pay/cs_456";
			const params = {
				orderId,
				id: "cs_456",
				provider: "stripe" as const,
				sessionURL,
			};

			mockOrderSvc.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			await manager.updatePayment(params);

			// Assert
			assert.strictEqual(mockOrderSvc.updatePayment.mock.callCount(), 1);
			const args = mockOrderSvc.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId, orderId);
			assert.strictEqual(args.id, params.id);
			assert.strictEqual(args.provider, params.provider);
			assert.strictEqual(args.sessionURL, sessionURL);
		});

		test("should pass through error from order service", async () => {
			// Arrange
			const error = new Error("Order not found");

			mockOrderSvc.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: error, success: false }),
			);

			// Act
			const result = await manager.updatePayment({
				orderId,
				id: "cs_123",
				provider: "stripe",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		test("should pass partial payment params to order service", async () => {
			// Arrange
			const params = { orderId, id: "new_id" };

			mockOrderSvc.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			await manager.updatePayment(params);

			// Assert
			assert.strictEqual(mockOrderSvc.updatePayment.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockOrderSvc.updatePayment.mock.calls[0].arguments[0],
				params,
			);
		});
	});
});
