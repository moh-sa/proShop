import assert from "node:assert/strict";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { NotFoundError } from "../../errors/index.js";
import { OrderManager } from "../../managers/order.manager.js";
import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import { OrderService } from "../../services/index.js";
import {
	generateMockCheckoutSessionResponse,
	generateMockInsertOrder,
	generateMockInsertOrders,
	generateMockInsertUser,
	generateMockObjectId,
	generateMockVerifyWebhookParams,
	mockPaymentService,
} from "../mocks/index.js";
import { connectTestDatabase, disconnectTestDatabase } from "../utils/index.js";

suite("Order Manager 〖 Integration Tests 〗", () => {
	const mockPayment = mockPaymentService();
	const orderService = new OrderService();
	const orderManager = new OrderManager(orderService, mockPayment);

	before(async () => {
		await connectTestDatabase();
	});

	after(async () => {
		await disconnectTestDatabase();
	});

	beforeEach(async () => {
		await Order.deleteMany({});
		await User.deleteMany({});
		mockPayment.reset();
	});

	describe("create", () => {
		test("should store order in database and return checkout URL", async () => {
			// Arrange
			const mockUser = await User.create(generateMockInsertUser());
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 2,
				user: mockUser,
			});
			const mockCheckoutResponse = generateMockCheckoutSessionResponse();
			mockPayment.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockCheckoutResponse,
					success: true,
				}),
			);

			// Act
			const result = await orderManager.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.order._id);
			assert.strictEqual(result.data.session.url, mockCheckoutResponse.url);
			assert.strictEqual(result.data.order.totalPrice, mockOrder.totalPrice);
			assert.strictEqual(
				result.data.order.orderItems.length,
				mockOrder.orderItems.length,
			);

			// Verify order was persisted in DB
			const order = await Order.findById(result.data.order._id);
			assert.strictEqual(order !== null, true);
			assert.strictEqual(order?.totalPrice, mockOrder.totalPrice);
		});

		test("should transform order items to Stripe checkout line items", async () => {
			// Arrange
			const mockUser = await User.create(generateMockInsertUser());
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 3,
				user: mockUser,
			});
			const mockCheckoutResponse = generateMockCheckoutSessionResponse();
			mockPayment.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockCheckoutResponse,
					success: true,
				}),
			);

			// Act
			await orderManager.create(mockOrder);

			// Assert
			const checkoutCallArgs =
				mockPayment.createCheckoutSession.mock.calls[0].arguments[0];

			assert.strictEqual(
				checkoutCallArgs.items.length,
				mockOrder.orderItems.length,
			);

			// Verify each line item has correct structure and values
			for (let i = 0; i < mockOrder.orderItems.length; i++) {
				const orderItem = mockOrder.orderItems[i];
				const lineItem = checkoutCallArgs.items[i];

				assert.strictEqual(lineItem.imageUrl, orderItem.image);
				assert.strictEqual(lineItem.name, orderItem.name);
				assert.strictEqual(lineItem.quantity, orderItem.qty);
				assert.strictEqual(lineItem.unitAmount, orderItem.price);
			}

			// Verify other checkout params
			assert.strictEqual(checkoutCallArgs.currency, "usd");
			assert.strictEqual(typeof checkoutCallArgs.orderId, "string");
			assert.strictEqual(typeof checkoutCallArgs.successUrl, "string");
			assert.strictEqual(typeof checkoutCallArgs.cancelUrl, "string");
		});
	});

	describe("getAll", () => {
		test("should return paginated orders from the order service", async () => {
			// Arrange
			const mockOrders = generateMockInsertOrders(3);
			await Order.insertMany(mockOrders);

			// Act
			const result = await orderManager.getAll({ pageNumber: "1" });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, 3);
			assert.strictEqual(result.data.meta !== undefined, true);
			assert.strictEqual(result.data.meta.totalItems, 3);
		});
	});

	describe("getById", () => {
		test("should return order by id from the order service", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderManager.getById({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data._id.toString(), orderId);
			assert.strictEqual(result.data.totalPrice, mockOrder.totalPrice);
		});
	});

	describe("processPaymentWebhook", () => {
		test("should return error when webhook verification fails", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const verifyError = new Error("Invalid webhook signature");
			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				error: verifyError,
				success: false,
			}));

			// Act
			const result =
				await orderManager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, verifyError);

			// Verify no data stored in database
			const orders = await Order.find({});
			assert.strictEqual(orders.length, 0);
		});

		test("should update order status to processing for checkout.session.completed event", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId },
					type: "checkout.session.completed",
				},
				success: true,
			}));

			// Act
			const result =
				await orderManager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			// Verify status was updated to processing
			const order = await Order.findById(orderId);
			assert.strictEqual(order !== null, true);
			assert.strictEqual(order?.status, "processing");
		});

		test("should return error when order not found during `checkout.session.completed` event", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const nonExistentOrderId = generateMockObjectId().toString();

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: nonExistentOrderId },
					type: "checkout.session.completed",
				},
				success: true,
			}));

			// Act
			const result =
				await orderManager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error instanceof NotFoundError, true);
		});

		test("should update order status to cancelled for checkout.session.expired event", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId },
					type: "checkout.session.expired",
				},
				success: true,
			}));

			// Act
			const result =
				await orderManager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			// Verify status was updated to cancelled
			const order = await Order.findById(orderId);
			assert.strictEqual(order !== null, true);
			assert.strictEqual(order?.status, "cancelled");
		});

		test("should NOT update call the database for unhandled event types", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId },
					type: "payment_intent.succeeded",
				},
				success: true,
			}));

			// Act
			const result =
				await orderManager.processPaymentWebhook(mockWebhookParams);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			// Verify order was NOT updated in DB
			const unchangedOrder = await Order.findById(orderId);
			assert.strictEqual(unchangedOrder !== null, true);
			assert.strictEqual(unchangedOrder?.status, "pending");
		});
	});

	describe("updateStatus", () => {
		test("should update order status to delivered", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "processing" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderManager.updateStatus({
				orderId,
				status: "delivered",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.status, "delivered");
			assert.strictEqual(result.data.deliveredAt instanceof Date, true);

			// Verify in DB
			const order = await Order.findById(orderId);
			assert.strictEqual(order?.status, "delivered");
		});

		test("should update order status to processing", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ status: "pending" });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderManager.updateStatus({
				orderId,
				status: "processing",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.status, "processing");
			assert.strictEqual(result.data.paidAt instanceof Date, true);

			// Verify in DB
			const order = await Order.findById(orderId);
			assert.strictEqual(order?.status, "processing");
		});
	});
});
