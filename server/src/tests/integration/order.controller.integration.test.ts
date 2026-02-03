import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { OrderController } from "../../controllers/index.js";
import { NotFoundError } from "../../errors/index.js";
import { OrderManager } from "../../managers/index.js";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import User from "../../models/user.model.js";
import { SuccessResponse } from "../../types/api-response.type.js";
import type { CreateOrderResponse } from "../../types/index.js";
import {
	generateMockCheckoutSessionResponse,
	generateMockInsertOrder,
	generateMockObjectId,
	generateMockSelectOrder,
	generateMockSelectOrders,
	generateMockSelectUser,
	mockPaymentService,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	convertOrderToCents,
	convertOrderToDollars,
	createMockExpressContext,
	disconnectTestDatabase,
	normalizeOrderPrices,
} from "../utils/index.js";

suite("Order Controller 〖 Integration Tests 〗", () => {
	const paymentService = mockPaymentService();
	const managerWithMockedPayment = new OrderManager(undefined, paymentService);
	const controller = new OrderController(managerWithMockedPayment);

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	beforeEach(async () => {
		await Order.deleteMany({});
		await User.deleteMany({});
		await Product.deleteMany({});
		paymentService.reset();
	});

	describe("create", () => {
		const mockSession = generateMockCheckoutSessionResponse();

		test("Should return success response when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrderData = generateMockInsertOrder({ user: mockUser._id });

			const { next, req, res } = createMockExpressContext();
			req.body = mockOrderData;
			res.locals.user = { _id: mockUser._id };

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.data.order);
			assert.ok(response.data.session);
		});

		test("Should return '201' status code when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrderData = generateMockInsertOrder({ user: mockUser._id });

			const { next, req, res } = createMockExpressContext();
			req.body = mockOrderData;
			res.locals.user = { _id: mockUser._id };

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 201);
		});

		test("Should create order when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrderData = generateMockInsertOrder({ user: mockUser._id });

			const { next, req, res } = createMockExpressContext();
			req.body = mockOrderData;
			res.locals.user = { _id: mockUser._id };

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.ok(response.data.order._id);
			assert.strictEqual(response.data.order.user._id, mockUser._id.toString());
			assert.strictEqual(response.data.order.user.name, mockUser.name);
			assert.strictEqual(response.data.order.user.email, mockUser.email);
			assert.strictEqual(
				response.data.order.orderItems.length,
				mockOrderData.orderItems.length,
			);
			assert.strictEqual(
				response.data.order.paymentMethod,
				mockOrderData.paymentMethod,
			);
		});

		test("Should include user ID in created order when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrderData = generateMockInsertOrder({ user: mockUser._id });

			const { next, req, res } = createMockExpressContext();
			req.body = mockOrderData;
			res.locals.user = { _id: mockUser._id };

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			// User should be populated with _id, name, email
			assert.strictEqual(response.data.order.user._id, mockUser._id.toString());
			assert.strictEqual(response.data.order.user.name, mockUser.name);
			assert.strictEqual(response.data.order.user.email, mockUser.email);
		});

		test("Should include session URL in response when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrderData = generateMockInsertOrder({ user: mockUser._id });

			const { next, req, res } = createMockExpressContext();
			req.body = mockOrderData;
			res.locals.user = { _id: mockUser._id };

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.data.session);
			assert.strictEqual(response.data.session.url, mockSession.url);
		});

		test("Should convert all price fields from dollars to cents when creating order", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrderData = generateMockInsertOrder({ user: mockUser._id });
			const expectedData = convertOrderToCents(mockOrderData);

			const { next, req, res } = createMockExpressContext();
			req.body = mockOrderData;
			res.locals.user = { _id: mockUser._id };

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			const createdOrder = await Order.findById(response.data.order._id);
			assert.ok(createdOrder);

			assert.strictEqual(createdOrder.itemsPrice, expectedData.itemsPrice);
			assert.strictEqual(
				createdOrder.shippingPrice,
				expectedData.shippingPrice,
			);
			assert.strictEqual(createdOrder.taxPrice, expectedData.taxPrice);
			assert.strictEqual(createdOrder.totalPrice, expectedData.totalPrice);

			createdOrder.orderItems.forEach((order, index) => {
				assert.strictEqual(order.price, expectedData.orderItems[index].price);
			});
		});

		test("Should convert all price fields from cents to dollars in response when creating order", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.create(mockUser);
			const mockOrderData = normalizeOrderPrices(
				generateMockInsertOrder({ user: mockUser._id }),
			);

			const { next, req, res } = createMockExpressContext();
			req.body = mockOrderData;
			res.locals.user = { _id: mockUser._id };

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData() as SuccessResponse<{
				data: CreateOrderResponse;
			}>;

			assert.strictEqual(
				response.data.order.itemsPrice,
				mockOrderData.itemsPrice,
			);
			assert.strictEqual(
				response.data.order.shippingPrice,
				mockOrderData.shippingPrice,
			);
			assert.strictEqual(response.data.order.taxPrice, mockOrderData.taxPrice);
			assert.strictEqual(
				response.data.order.totalPrice,
				mockOrderData.totalPrice,
			);

			response.data.order.orderItems.forEach((order, index) => {
				assert.strictEqual(order.price, mockOrderData.orderItems[index].price);
			});
		});
	});

	describe("getById", () => {
		test("Should return success response when 'service.getById' is called with valid data", async () => {
			// Arrange
			const mockOrder = convertOrderToCents(generateMockSelectOrder());
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.getById' is called with valid data", async () => {
			// Arrange
			const mockOrder = convertOrderToCents(generateMockSelectOrder());
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return order object when 'service.getById' is called with existing order", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder();
			await Order.insertMany([mockOrder]);
			const { next, req, res } = createMockExpressContext();

			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.strictEqual(response.data._id, mockOrder._id.toString());
		});

		test("Should return order with correct user data when 'service.getById' is called with existing order", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);

			const mockOrder = convertOrderToCents(
				generateMockSelectOrder({ user: mockUser }),
			);
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.data.user._id, mockUser._id.toString());
			assert.strictEqual(response.data.user.email, mockUser.email);
			assert.strictEqual(response.data.user.name, mockUser.name);
		});

		test("Should throw 'NotFoundError' when 'service.getById' is called with non-existent order id", async () => {
			// Arrange
			const orderId = generateMockObjectId();

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: orderId.toString() };

			// Act & Assert
			await assert.rejects(
				async () => await controller.getById(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Order not found");
					return true;
				},
			);
		});

		test("Should convert all price fields from cents to dollars in response when retrieving order by id", async () => {
			// Arrange
			const mockOrderData = convertOrderToCents(generateMockSelectOrder());
			await Order.insertMany([mockOrderData]);
			const expectedData = convertOrderToDollars(mockOrderData);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrderData._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData() as SuccessResponse<{
				data: typeof mockOrderData;
			}>;

			assert.strictEqual(response.data.itemsPrice, expectedData.itemsPrice);
			assert.strictEqual(
				response.data.shippingPrice,
				expectedData.shippingPrice,
			);
			assert.strictEqual(response.data.taxPrice, expectedData.taxPrice);
			assert.strictEqual(response.data.totalPrice, expectedData.totalPrice);

			response.data.orderItems.forEach((order, index) => {
				assert.strictEqual(order.price, expectedData.orderItems[index].price);
			});
		});
	});

	describe("getAll", () => {
		test("Should return success response when called with valid pagination parameters", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(2);
			await Order.insertMany(mockOrders);

			const { next, req, res } = createMockExpressContext();
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
		});

		test("Should return '200' status code when called with valid pagination parameters", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.query = { pageNumber: "1" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return paginated response structure when called with existing orders", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(2);
			await Order.insertMany(mockOrders);

			const { next, req, res } = createMockExpressContext();
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 2);
			assert.strictEqual(response.meta.totalItems, 2);
		});

		test("Should return empty paginated response when no orders exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.query = { pageNumber: "1" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 0);
			assert.strictEqual(response.meta.totalItems, 0);
		});

		test("Should handle query parameters correctly", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(3);
			await Order.insertMany(mockOrders);

			const { next, req, res } = createMockExpressContext();
			req.query = {
				isPaid: "true",
				pageNumber: "1",
				pageSize: "2",
				sort: "createdAt:desc",
			};

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.ok(response.meta);
			assert.strictEqual(response.meta.pageSize, 2);
		});

		test("Should handle empty query parameters", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(1);
			await Order.insertMany(mockOrders);

			const { next, req, res } = createMockExpressContext();
			req.query = {};

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.ok(response.meta);
		});

		test("Should convert totalPrice from cents to dollars in response when retrieving all orders", async () => {
			// Arrange
			const mockOrders = generateMockSelectOrders(2).map(convertOrderToCents);
			await Order.insertMany(mockOrders);

			const expectedData = mockOrders.map(convertOrderToDollars);

			const { next, req, res } = createMockExpressContext();
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData() as SuccessResponse<{
				data: typeof mockOrders;
			}>;

			response.data.forEach((order) => {
				const originalOrder = expectedData.find(
					(o) => o._id.toString() === order._id.toString(),
				);

				assert.strictEqual(order.totalPrice, originalOrder?.totalPrice);
			});
		});
	});

	describe("getAllByUserId", () => {
		test("Should return success response when called with valid userId and pagination parameters", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder();
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { userId: mockOrder.user._id.toString() };
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
		});

		test("Should return '200' status code when called with valid userId and pagination parameters", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder();
			const { next, req, res } = createMockExpressContext();

			req.params = { userId: mockOrder.user._id.toString() };
			req.query = { pageNumber: "1" };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return paginated response for specific user when called with existing orders", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const mockOrders = generateMockSelectOrders(3, { user: mockUser });
			const otherOrders = generateMockSelectOrders(2);
			await Order.insertMany([...mockOrders, ...otherOrders]);

			const { next, req, res } = createMockExpressContext();
			req.params = { userId: mockUser._id.toString() };
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 3);
			assert.strictEqual(response.meta.totalItems, 3);
		});

		test("Should return empty paginated response when user has no orders", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const mockOrders = generateMockSelectOrders(5);
			await Order.insertMany(mockOrders);

			const { next, req, res } = createMockExpressContext();
			req.params = { userId: mockUser._id.toString() };
			req.query = { pageNumber: "1" };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 0);
			assert.strictEqual(response.meta.totalItems, 0);
		});

		test("Should not return orders from other users when called with specific userId", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);

			const mockOrder1 = generateMockSelectOrder({ user: mockUser });
			const mockOrder2 = generateMockSelectOrder();
			await Order.insertMany([mockOrder1, mockOrder2]);

			const { next, req, res } = createMockExpressContext();
			req.params = { userId: mockOrder1.user._id.toString() };
			req.query = { pageNumber: "1" };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 1);
			assert.strictEqual(
				response.data[0].user.toString(),
				mockOrder1.user._id.toString(),
			);
		});

		test("Should handle query parameters with userId correctly", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const paidOrders = generateMockSelectOrders(2, {
				isPaid: true,
				user: mockUser,
			});
			const unpaidOrders = generateMockSelectOrders(1, {
				isPaid: false,
				user: mockUser,
			});
			await Order.insertMany([...paidOrders, ...unpaidOrders]);

			const { next, req, res } = createMockExpressContext();
			req.params = { userId: mockUser._id.toString() };
			req.query = {
				isPaid: "true",
				pageNumber: "1",
				pageSize: "10",
			};

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 2);
			assert.ok(response.data.every((order: any) => order.isPaid === true));
		});

		test("Should handle empty query parameters with userId", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder();
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { userId: mockOrder.user._id.toString() };
			req.query = {};

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.ok(response.meta);
		});

		test("Should convert totalPrice from cents to dollars in response when retrieving orders by user id", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();

			const mockOrders = generateMockSelectOrders(2, {
				user: mockUser,
			}).map(convertOrderToCents);
			await Order.insertMany(mockOrders);

			const expectedData = mockOrders.map(convertOrderToDollars);

			const { next, req, res } = createMockExpressContext();
			req.params = { userId: mockUser._id.toString() };
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData() as SuccessResponse<{
				data: typeof mockOrders;
			}>;

			response.data.forEach((order) => {
				const originalOrder = expectedData.find(
					(o) => o._id.toString() === order._id.toString(),
				);

				assert.strictEqual(order.totalPrice, originalOrder?.totalPrice);
			});
		});
	});

	describe("updateToPaid", () => {
		test("Should return success response when 'service.updateToPaid' is called with valid data", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ isPaid: true });
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToPaid(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.updateToPaid' is called with valid data", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ isPaid: false });
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToPaid(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should set 'isPaid' to true when 'service.updateToPaid' is called with existing order", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ isPaid: false });
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToPaid(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.strictEqual(response.data.isPaid, true);
		});

		test("Should set 'paidAt' timestamp when 'service.updateToPaid' is called with existing order", async (t) => {
			// Arrange
			t.mock.timers.enable({ apis: ["Date"], now: new Date() });

			const mockOrder = generateMockSelectOrder({
				isPaid: false,
				paidAt: undefined,
			});
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToPaid(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.ok(response.data.paidAt);

			t.mock.timers.tick(100); // Ensure that current date is at least 100ms ahead of response date
			assert.ok(new Date(response.data.paidAt) < new Date());
		});

		test("Should throw 'NotFoundError' when 'service.updateToPaid' is called with non-existent order id", async () => {
			// Arrange
			const orderId = generateMockObjectId();
			const { next, req, res } = createMockExpressContext();

			req.params = { orderId: orderId.toString() };

			// Act & Assert
			await assert.rejects(
				async () => await controller.updateToPaid(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Order not found");
					return true;
				},
			);
		});

		test("Should convert all price fields from cents to dollars in response when updating order to paid", async () => {
			// Arrange
			const mockOrder = convertOrderToCents(
				generateMockSelectOrder({ isPaid: false }),
			);
			await Order.insertMany([mockOrder]);

			const expectedData = convertOrderToDollars(mockOrder);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToPaid(req, res, next);

			// Assert
			const response = res._getJSONData() as SuccessResponse<{
				data: typeof mockOrder;
			}>;

			assert.strictEqual(response.data.itemsPrice, expectedData.itemsPrice);
			assert.strictEqual(
				response.data.shippingPrice,
				expectedData.shippingPrice,
			);
			assert.strictEqual(response.data.taxPrice, expectedData.taxPrice);
			assert.strictEqual(response.data.totalPrice, expectedData.totalPrice);

			response.data.orderItems.forEach((order, index) => {
				assert.strictEqual(order.price, expectedData.orderItems[index].price);
			});
		});
	});

	describe("updateToDelivered", () => {
		test("Should return success response when 'service.updateToDelivered' is called with valid data", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ isDelivered: false });
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToDelivered(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.updateToDelivered' is called with valid data", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ isDelivered: false });
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToDelivered(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should set 'isDelivered' to true when 'service.updateToDelivered' is called with existing order", async () => {
			// Arrange
			const mockOrder = generateMockSelectOrder({ isDelivered: false });
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToDelivered(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.strictEqual(response.data.isDelivered, true);
		});

		test("Should set 'deliveredAt' timestamp when 'service.updateToDelivered' is called with existing order", async (t) => {
			// Arrange
			t.mock.timers.enable({ apis: ["Date"], now: new Date() });

			const mockOrder = generateMockSelectOrder({
				deliveredAt: undefined,
				isDelivered: false,
			});
			await Order.insertMany([mockOrder]);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToDelivered(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.ok(response.data.deliveredAt);

			t.mock.timers.tick(100); // Ensure that current date is at least 100ms ahead of response date
			assert.ok(new Date(response.data.deliveredAt) < new Date());
		});

		test("Should throw 'NotFoundError' when 'service.updateToDelivered' is called with non-existent order id", async () => {
			// Arrange
			const orderId = generateMockObjectId();

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: orderId.toString() };

			// Act & Assert
			await assert.rejects(
				async () => await controller.updateToDelivered(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Order not found");
					return true;
				},
			);
		});

		test("Should convert all price fields from cents to dollars in response when updating order to delivered", async () => {
			// Arrange
			const mockOrder = convertOrderToCents(
				generateMockSelectOrder({ isDelivered: false }),
			);
			await Order.insertMany([mockOrder]);

			const expectedData = convertOrderToDollars(mockOrder);

			const { next, req, res } = createMockExpressContext();
			req.params = { orderId: mockOrder._id.toString() };

			// Act
			await controller.updateToDelivered(req, res, next);

			// Assert
			const response = res._getJSONData() as SuccessResponse<{
				data: typeof mockOrder;
			}>;

			assert.strictEqual(response.data.itemsPrice, expectedData.itemsPrice);
			assert.strictEqual(
				response.data.shippingPrice,
				expectedData.shippingPrice,
			);
			assert.strictEqual(response.data.taxPrice, expectedData.taxPrice);
			assert.strictEqual(response.data.totalPrice, expectedData.totalPrice);

			response.data.orderItems.forEach((order, index) => {
				assert.strictEqual(order.price, expectedData.orderItems[index].price);
			});
		});
	});

	describe("handleStripeWebhook", () => {
		// Note: These tests focus on validation logic that doesn't require Stripe.
		// Full webhook processing tests would require mocking Stripe signature verification.

		test("Should return 400 when 'stripe-signature' header is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.body = Buffer.from("test-payload");
			req.headers = {};

			// Act
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 400);

			const response = res._getJSONData();
			assert.ok(response.errors);
			assert.strictEqual(response.success, false);
		});

		test("Should return 400 when 'stripe-signature' header is an array instead of string", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.body = Buffer.from("test-payload");
			req.headers = {
				"stripe-signature": ["sig1", "sig2"] as unknown as string,
			};

			// Act
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 400);

			const response = res._getJSONData();
			assert.ok(response.errors);
			assert.strictEqual(response.success, false);
		});

		test("Should return 400 when body is not a Buffer", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.body = { notABuffer: true };
			req.headers = { "stripe-signature": "valid-signature" };

			// Act
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 400);

			const response = res._getJSONData();
			assert.ok(response.errors);
			assert.strictEqual(response.success, false);
		});

		test("Should return 400 with appropriate error message when body is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.body = undefined;
			req.headers = { "stripe-signature": "valid-signature" };

			// Act
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 400);

			const response = res._getJSONData();
			assert.strictEqual(response.success, false);
			assert.ok(
				response.errors.some(
					(e: { message: string }) =>
						e.message.toLowerCase().includes("body") ||
						e.message.toLowerCase().includes("invalid"),
				),
			);
		});
	});
});
