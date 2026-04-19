import assert from "node:assert/strict";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { NotFoundError } from "../../errors/index.js";
import { OrderManager } from "../../managers/order.manager.js";
import { OrderModel } from "../../models/order.model.js";
import { UserModel } from "../../models/user.model.js";
import { orderRepository } from "../../repositories/index.js";
import { OrderService } from "../../services/index.js";
import type { GetAllOrdersServiceParams } from "../../types/order.type.js";
import {
	generateMockCheckoutSessionResponse,
	generateMockInsertOrder,
	generateMockInsertOrders,
	generateMockObjectId,
	generateMockVerifyWebhookParams,
	mockPaymentService,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createOrder,
	createOrders,
	disconnectTestDatabase,
} from "../utils/index.js";

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
		await OrderModel.deleteMany({});
		await UserModel.deleteMany({});
		mockPayment.reset();
	});

	describe("create", () => {
		test("should store order in database and return checkout URL", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 2,
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
			assert.ok(result.data.order.id);
			assert.strictEqual(result.data.session.url, mockCheckoutResponse.url);
			assert.strictEqual(result.data.order.totalPrice, mockOrder.totalPrice);
			assert.strictEqual(
				result.data.order.orderItems.length,
				mockOrder.orderItems.length,
			);

			// Verify order was persisted in DB
			const order = await orderRepository.getById({
				orderId: result.data.order.id,
			});
			assert.ok(order.success);
			assert.ok(order.data);

			assert.strictEqual(order.data.totalPrice, mockOrder.totalPrice);
		});

		test("should transform order items to Stripe checkout line items", async () => {
			// Arrange
			// const mockUser = await UserModel.create(generateMockInsertUser());
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 3,
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
			const expectedItems = checkoutCallArgs.items.filter(
				(i) => i.name !== "Shipping" && i.name !== "Tax",
			);

			assert.strictEqual(expectedItems.length, mockOrder.orderItems.length);

			// Verify each line item has correct structure and values
			mockOrder.orderItems.forEach((item, index) => {
				const lineItem = expectedItems[index];

				assert.strictEqual(lineItem.name, item.name);
				assert.strictEqual(lineItem.quantity, item.qty);
				assert.strictEqual(lineItem.unitAmount, item.price);
			});

			// Verify other checkout params
			assert.strictEqual(checkoutCallArgs.currency, "usd");
			assert.strictEqual(typeof checkoutCallArgs.orderId, "string");
			assert.strictEqual(typeof checkoutCallArgs.successUrl, "string");
			assert.strictEqual(typeof checkoutCallArgs.cancelUrl, "string");
		});

		test("should include shipping as a checkout line item when shipping is charged", async () => {
			// Arrange
			const shippingPrice = 5.99;
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 2,
				shippingPrice,
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

			const checkoutCallArgs =
				mockPayment.createCheckoutSession.mock.calls[0].arguments[0];

			assert.strictEqual(
				checkoutCallArgs.items.length,
				mockOrder.orderItems.length + 2, // +2 for shipping and tax lines
			);

			const shippingLine = checkoutCallArgs.items.filter(
				(i) => i.name === "Shipping",
			);

			assert.strictEqual(shippingLine.length, 1);

			assert.strictEqual(shippingLine[0].name, "Shipping");
			assert.strictEqual(shippingLine[0].quantity, 1);
			assert.strictEqual(
				shippingLine[0].unitAmount,
				result.data.order.shippingPrice,
			);
		});

		test("should not add shipping line item when shippingPrice is zero", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 2,
				shippingPrice: 0,
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
				mockOrder.orderItems.length + 1, // +1 for tax line
			);

			assert.strictEqual(
				checkoutCallArgs.items.some((i) => i.name === "Shipping"),
				false,
			);
		});

		test("should include tax as a checkout line item when tax is charged", async () => {
			// Arrange
			const taxPrice = 4.25;
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 2,
				taxPrice,
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

			const checkoutCallArgs =
				mockPayment.createCheckoutSession.mock.calls[0].arguments[0];

			assert.strictEqual(
				checkoutCallArgs.items.length,
				mockOrder.orderItems.length + 2, // +2 for shipping and tax lines
			);

			const taxLine = checkoutCallArgs.items.filter((i) => i.name === "Tax");

			assert.strictEqual(taxLine[0].name, "Tax");
			assert.strictEqual(taxLine[0].quantity, 1);
			assert.strictEqual(taxLine[0].unitAmount, result.data.order.taxPrice);
		});

		test("should not add tax line item when taxPrice is zero", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder({
				orderItemsCount: 2,
				taxPrice: 0,
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
				mockOrder.orderItems.length + 1, // +1 for shipping line
			);
			assert.strictEqual(
				checkoutCallArgs.items.some((i) => i.name === "Tax"),
				false,
			);
		});

		test("Should store the checkout session id and sessionURL in the order", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();
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

			const order = await orderRepository.getById({
				orderId: result.data.order.id,
			});
			assert.ok(order.success);
			assert.ok(order.data);

			assert.ok(order.data.payment);
			assert.strictEqual(order.data.payment.id, mockCheckoutResponse.id);
			assert.strictEqual(order.data.payment.provider, "stripe");
			assert.strictEqual(
				order.data.payment.sessionURL,
				mockCheckoutResponse.url,
			);
		});
	});

	describe("getAll", () => {
		test("should return paginated orders from the order service", async () => {
			// Arrange
			await createOrders(generateMockInsertOrders(3));

			const args: GetAllOrdersServiceParams = {
				pageNumber: "1",
				pageSize: "10",
			};
			// Act
			const result = await orderManager.getAll(args);

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
			const createdOrder = await createOrder(generateMockInsertOrder());

			const orderId = createdOrder.id;

			// Act
			const result = await orderManager.getById({ orderId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.id, orderId);
			assert.strictEqual(result.data.totalPrice, createdOrder.totalPrice);
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
			const orders = await orderRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
			});
			assert.ok(orders.success);

			assert.strictEqual(orders.data.items.length, 0);
			assert.strictEqual(orders.data.meta.totalItems, 0);
		});

		test("should update order status and paidAt for checkout.session.completed event", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const mockPaidAt = new Date();

			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "pending" }),
			);
			const orderId = createdOrder.id;

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId },
					paidAt: mockPaidAt,
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

			// Verify status and paidAt were updated in DB
			const order = await orderRepository.getById({ orderId });
			assert.ok(order.success);
			assert.ok(order.data);

			assert.strictEqual(order.data.status, "processing");
			assert.ok(order.data.payment);
			assert.strictEqual(
				order.data.payment.paidAt?.getTime(),
				mockPaidAt.getTime(),
			);
		});

		test("should return error when order not found during `checkout.session.completed` event", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const nonExistentOrderId = generateMockObjectId();

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: nonExistentOrderId },
					paidAt: new Date(),
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

			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "pending" }),
			);
			const orderId = createdOrder.id;

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId },
					paidAt: new Date(),
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

			// Verify order was updated to cancelled in DB
			const order = await orderRepository.getById({ orderId });
			assert.ok(order.success);
			assert.ok(order.data);

			assert.strictEqual(order.data.status, "cancelled");
		});

		test("should return error when order not found during checkout.session.expired event", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();
			const nonExistentOrderId = generateMockObjectId();

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId: nonExistentOrderId },
					paidAt: new Date(),
					type: "checkout.session.expired",
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

		test("should NOT update the database for unhandled event types", async () => {
			// Arrange
			const mockWebhookParams = generateMockVerifyWebhookParams();

			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "pending" }),
			);
			const orderId = createdOrder.id;

			mockPayment.verifyWebhook.mock.mockImplementationOnce(() => ({
				data: {
					metadata: { orderId },
					paidAt: new Date(),
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
			const unchangedOrder = await orderRepository.getById({ orderId });
			assert.ok(unchangedOrder.success);
			assert.ok(unchangedOrder.data);

			assert.strictEqual(unchangedOrder.data.status, "pending");
		});
	});

	describe("updatePayment", () => {
		test("Should update payment through manager", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "processing" }),
			);
			const orderId = createdOrder.id;

			const paymentId = "cs_123";
			const paymentProvider = "stripe";
			const sessionURL = "https://checkout.stripe.com/c/pay/cs_123";

			// Act
			const result = await orderManager.updatePayment({
				orderId,
				id: paymentId,
				provider: paymentProvider,
				sessionURL,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.payment?.id, paymentId);
			assert.strictEqual(result.data.payment?.provider, paymentProvider);
			assert.strictEqual(result.data.payment?.sessionURL, sessionURL);

			// Verify in DB
			const order = await orderRepository.getById({ orderId });
			assert.ok(order.success);
			assert.ok(order.data);

			assert.ok(order.data.payment);
			assert.strictEqual(order.data.payment.id, paymentId);
			assert.strictEqual(order.data.payment.provider, paymentProvider);
			assert.strictEqual(order.data.payment.sessionURL, sessionURL);
		});
	});
});
