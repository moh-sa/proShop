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
		test("should create order in DB and return checkout URL when order and checkout session succeed", async () => {
			// Arrange
			const mockUser = await User.create(generateMockInsertUser());
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 2,
				user: mockUser._id,
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
			const orderInDb = await Order.findById(result.data.order._id);
			assert.strictEqual(orderInDb !== null, true);
			assert.strictEqual(orderInDb?.totalPrice, mockOrder.totalPrice);
			// Verify PaymentService was called
			assert.strictEqual(mockPayment.createCheckoutSession.mock.callCount(), 1);
		});

		test("should persist order in DB but return error when checkout session creation fails", async () => {
			// Arrange - Create a real user first (required for order population)
			const mockUser = await User.create(generateMockInsertUser());
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 1,
				user: mockUser._id,
			});
			const checkoutError = new Error("Stripe API error");
			mockPayment.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: checkoutError, success: false }),
			);

			// Act
			const result = await orderManager.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, checkoutError);

			// Verify order WAS still created in DB (order creation succeeded before checkout failed)
			const ordersInDb = await Order.find({});
			assert.strictEqual(ordersInDb.length, 1);
			assert.strictEqual(ordersInDb[0].totalPrice, mockOrder.totalPrice);

			// Verify PaymentService was called
			assert.strictEqual(mockPayment.createCheckoutSession.mock.callCount(), 1);
		});

		test("should correctly transform order items to Stripe line items format", async () => {
			// Arrange - Create a real user first (required for order population)
			const mockUser = await User.create(generateMockInsertUser());
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 3,
				user: mockUser._id,
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

			// Assert - Verify the line items transformation
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
		test("should delegate to order service and return paginated response", async () => {
			// Arrange
			const orders = [
				generateMockInsertOrder(),
				generateMockInsertOrder(),
				generateMockInsertOrder(),
			];
			await Order.insertMany(orders);

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
		test("should delegate to order service and return order when found", async () => {
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

			// Verify no DB operations happened
			const ordersInDb = await Order.find({});
			assert.strictEqual(ordersInDb.length, 0);
		});

		test("should update order to paid in DB for checkout.session.completed event", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const mockOrder = generateMockInsertOrder({ isPaid: false });
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

			// Verify order was updated in DB
			const updatedOrder = await Order.findById(orderId);
			assert.strictEqual(updatedOrder !== null, true);
			assert.strictEqual(updatedOrder?.isPaid, true);
			assert.strictEqual(updatedOrder?.paidAt instanceof Date, true);
		});

		test("should return error when order not found during checkout.session.completed", async () => {
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

		test("should return success without updating DB for checkout.session.expired event", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const mockOrder = generateMockInsertOrder({ isPaid: false });
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

			// Verify order was NOT updated in DB
			const unchangedOrder = await Order.findById(orderId);
			assert.strictEqual(unchangedOrder !== null, true);
			assert.strictEqual(unchangedOrder?.isPaid, false);
			assert.strictEqual(unchangedOrder?.paidAt, undefined);
		});

		test("should return success without updating DB for unhandled event types", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const mockOrder = generateMockInsertOrder({ isPaid: false });
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
			assert.strictEqual(unchangedOrder?.isPaid, false);
		});
	});

	describe("updateToDelivered", () => {
		test("should delegate to order service and update order in DB", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isDelivered: false });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderManager.updateToDelivered({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isDelivered, true);
			assert.strictEqual(result.data.deliveredAt instanceof Date, true);

			// Verify in DB
			const updatedOrder = await Order.findById(orderId);
			assert.strictEqual(updatedOrder?.isDelivered, true);
		});
	});

	describe("updateToPaid", () => {
		test("should delegate to order service and update order in DB", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({ isPaid: false });
			const createdOrder = await Order.create(mockOrder);
			const orderId = createdOrder._id.toString();

			// Act
			const result = await orderManager.updateToPaid({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isPaid, true);
			assert.strictEqual(result.data.paidAt instanceof Date, true);

			// Verify in DB
			const updatedOrder = await Order.findById(orderId);
			assert.strictEqual(updatedOrder?.isPaid, true);
		});
	});
});
