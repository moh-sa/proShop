import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { OrderController } from "../../controllers/index.js";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import { OrderManager } from "../../managers/index.js";
import { OrderModel } from "../../models/order.model.js";
import { orderRepository } from "../../repositories/order.repository.js";
import type { SuccessResponse } from "../../types/api-response.type.js";
import {
	generateMockCheckoutSessionResponse,
	generateMockInsertOrder,
	generateMockInsertOrders,
	generateMockObjectId,
	generateMockSelectUser,
	mockPaymentService,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	convertOrderToCents,
	convertOrderToDollars,
	createMockExpressContextFromHandler,
	createOrder,
	createOrders,
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
		await OrderModel.deleteMany({});
		paymentService.reset();
	});

	describe("create", () => {
		const mockSession = generateMockCheckoutSessionResponse();

		test("Should return success response when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockOrderData = generateMockInsertOrder();
			const mockUser = generateMockSelectUser(mockOrderData.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockOrderData;
			res.locals.user = mockUser;

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.data.order);
			assert.ok(response.data.session);
		});

		test("Should return '201' status code when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockOrderData = generateMockInsertOrder();
			const mockUser = generateMockSelectUser(mockOrderData.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockOrderData;
			res.locals.user = mockUser;

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
			const mockOrderData = generateMockInsertOrder();
			const mockUser = generateMockSelectUser(mockOrderData.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockOrderData;
			res.locals.user = mockUser;

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.data.order.id);
			assert.strictEqual(response.data.order.user.id, mockOrderData.user.id);
			assert.strictEqual(
				response.data.order.user.name,
				mockOrderData.user.name,
			);
			assert.strictEqual(
				response.data.order.user.email,
				mockOrderData.user.email,
			);
			assert.strictEqual(
				response.data.order.orderItems.length,
				mockOrderData.orderItems.length,
			);
		});

		test("Should include user ID in created order when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockOrderData = generateMockInsertOrder();
			const mockUser = generateMockSelectUser(mockOrderData.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockOrderData;
			res.locals.user = mockUser;

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			// User should be populated with id, name, email
			assert.strictEqual(response.data.order.user.id, mockOrderData.user.id);
			assert.strictEqual(
				response.data.order.user.name,
				mockOrderData.user.name,
			);
			assert.strictEqual(
				response.data.order.user.email,
				mockOrderData.user.email,
			);
		});

		test("Should include session URL in response when 'manager.create' is called with valid data", async () => {
			// Arrange
			const mockOrderData = generateMockInsertOrder();
			const mockUser = generateMockSelectUser(mockOrderData.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockOrderData;
			res.locals.user = mockUser;

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data.session);
			assert.strictEqual(response.data.session.url, mockSession.url);
		});

		test("Should convert all price fields from dollars to cents when creating order", async () => {
			// Arrange
			const mockOrderData = generateMockInsertOrder();
			const expectedData = convertOrderToCents(mockOrderData);

			const mockUser = generateMockSelectUser(mockOrderData.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockOrderData;
			res.locals.user = mockUser;

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);

			const foundOrder = await orderRepository.getById({
				orderId: response.data.order.id,
			});
			assert.ok(foundOrder.success);
			assert.ok(foundOrder.data);

			assert.strictEqual(foundOrder.data.itemsPrice, expectedData.itemsPrice);
			assert.strictEqual(
				foundOrder.data.shippingPrice,
				expectedData.shippingPrice,
			);
			assert.strictEqual(foundOrder.data.taxPrice, expectedData.taxPrice);
			assert.strictEqual(foundOrder.data.totalPrice, expectedData.totalPrice);

			foundOrder.data.orderItems.forEach((order, index) => {
				assert.strictEqual(order.price, expectedData.orderItems[index].price);
			});
		});

		test("Should convert all price fields from cents to dollars in response when creating order", async () => {
			// Arrange
			const mockOrderData = normalizeOrderPrices(generateMockInsertOrder());
			const mockUser = generateMockSelectUser(mockOrderData.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockOrderData;
			res.locals.user = mockUser;

			paymentService.createCheckoutSession.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSession, success: true }),
			);

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);

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
			const createdOrder = await createOrder(generateMockInsertOrder());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { orderId: createdOrder.id };
			res.locals.user = generateMockSelectUser({
				id: createdOrder.user.id,
				isAdmin: false,
			});

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.getById' is called with valid data", async () => {
			// Arrange
			const createdOrder = await createOrder(generateMockInsertOrder());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { orderId: createdOrder.id };
			res.locals.user = generateMockSelectUser({
				id: createdOrder.user.id,
				isAdmin: false,
			});

			// Act
			await controller.getById(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return order object when 'service.getById' is called with existing order", async () => {
			// Arrange
			const createdOrder = await createOrder(generateMockInsertOrder());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { orderId: createdOrder.id };
			res.locals.user = generateMockSelectUser({
				id: createdOrder.user.id,
				isAdmin: false,
			});

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.id, createdOrder.id);
		});

		test("Should return order with correct user data when 'service.getById' is called with existing order", async () => {
			// Arrange
			const createdOrder = await createOrder(generateMockInsertOrder());
			const mockUser = generateMockSelectUser(createdOrder.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { orderId: createdOrder.id };
			res.locals.user = mockUser;

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.user.id, createdOrder.user.id);
			assert.strictEqual(response.data.user.email, createdOrder.user.email);
			assert.strictEqual(response.data.user.name, createdOrder.user.name);
		});

		test("Should throw 'NotFoundError' when 'service.getById' is called with non-existent order id", async () => {
			// Arrange
			const orderId = generateMockObjectId();

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { orderId: orderId };

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
			const createdOrder = await createOrder(generateMockInsertOrder());

			const expectedData = convertOrderToDollars(createdOrder);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { orderId: createdOrder.id };
			res.locals.user = generateMockSelectUser({
				id: createdOrder.user.id,
				isAdmin: false,
			});

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData() as SuccessResponse<{
				data: typeof createdOrder;
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

		test("Should return 403 when different user requests another user's order", async () => {
			// Arrange
			const createdOrder = await createOrder(generateMockInsertOrder());

			const differentUser = generateMockSelectUser({ isAdmin: false });

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { orderId: createdOrder.id };
			res.locals.user = differentUser;

			// Act & Assert
			await assert.rejects(
				async () => await controller.getById(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof ForbiddenError);
					assert.strictEqual(
						error.message,
						"You are not authorized to access this resource.",
					);
					return true;
				},
			);
		});

		test("Should return 200 when admin requests another user's order", async () => {
			// Arrange
			const createdOrder = await createOrder(generateMockInsertOrder());

			const adminUser = generateMockSelectUser({ isAdmin: true });

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { orderId: createdOrder.id };
			res.locals.user = adminUser;

			// Act
			await controller.getById(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);

			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.id, createdOrder.id);
		});
	});

	describe("getAll", () => {
		test("Should return success response when called with valid pagination parameters", async () => {
			// Arrange
			await createOrders(generateMockInsertOrders(2));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
		});

		test("Should return '200' status code when called with valid pagination parameters", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return paginated response structure when called with existing orders", async () => {
			// Arrange
			await createOrders(generateMockInsertOrders(2));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 2);
			assert.strictEqual(response.meta.totalItems, 2);
		});

		test("Should return empty paginated response when no orders exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 0);
			assert.strictEqual(response.meta.totalItems, 0);
		});

		test("Should handle query parameters correctly", async () => {
			// Arrange
			await createOrders(generateMockInsertOrders(3));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = {
				status: "processing",
				pageNumber: "1",
				pageSize: "2",
				sort: "createdAt:desc",
			};

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
			assert.strictEqual(response.meta.pageSize, 2);
		});

		test("Should handle empty query parameters", async () => {
			// Arrange
			await createOrder(generateMockInsertOrder());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			// @ts-expect-error - test case
			req.query = {};

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
		});

		test("Should convert totalPrice from cents to dollars in response when retrieving all orders", async () => {
			// Arrange
			const createdOrders = await createOrders(generateMockInsertOrders(2));

			const expectedData = createdOrders.map(convertOrderToDollars);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);

			response.data.forEach((order) => {
				const originalOrder = expectedData.find((o) => o.id === order.id);

				assert.strictEqual(order.totalPrice, originalOrder?.totalPrice);
			});
		});
	});

	describe("getAllByUserId", () => {
		test("Should return success response when called with valid userId and pagination parameters", async () => {
			// Arrange
			const createdOrder = await createOrder(generateMockInsertOrder());

			const userId = createdOrder.user.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId };
			req.query = { pageNumber: "1", pageSize: "10" };
			res.locals.user = generateMockSelectUser({
				id: userId,
				isAdmin: false,
			});

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
		});

		test("Should return '200' status code when called with valid userId and pagination parameters", async () => {
			// Arrange
			const mockOrder = generateMockInsertOrder();

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: mockOrder.user.id };
			req.query = { pageNumber: "1", pageSize: "10" };
			res.locals.user = generateMockSelectUser({
				id: mockOrder.user.id,
				isAdmin: false,
			});

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return paginated response for specific user when called with existing orders", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();

			await createOrders([
				...generateMockInsertOrders(3, { user: mockUser }),
				...generateMockInsertOrders(2),
			]);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: mockUser.id };
			req.query = { pageNumber: "1", pageSize: "10" };
			res.locals.user = mockUser;

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 3);
			assert.strictEqual(response.meta.totalItems, 3);
		});

		test("Should return empty paginated response when user has no orders", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();

			await createOrders(generateMockInsertOrders(5));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: mockUser.id };
			req.query = { pageNumber: "1", pageSize: "10" };
			res.locals.user = mockUser;

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 0);
			assert.strictEqual(response.meta.totalItems, 0);
		});

		test("Should not return orders from other users when called with specific userId", async () => {
			// Arrange
			const createdOrders = await createOrders(generateMockInsertOrders(2));
			const orderOwner = generateMockSelectUser(createdOrders[0].user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: orderOwner.id };
			req.query = { pageNumber: "1", pageSize: "10" };
			res.locals.user = orderOwner;

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 1);
			assert.strictEqual(response.data[0].user.id, orderOwner.id);
		});

		test("Should handle query parameters with userId correctly", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();

			await createOrders([
				...generateMockInsertOrders(2, {
					status: "processing",
					user: mockUser,
				}),
				...generateMockInsertOrders(2, { status: "pending", user: mockUser }),
			]);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: mockUser.id };
			req.query = {
				status: "processing",
				pageNumber: "1",
				pageSize: "10",
			};
			res.locals.user = mockUser;

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(Array.isArray(response.data));
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 2);
			assert.ok(
				response.data.every(
					(order: { status: string }) => order.status === "processing",
				),
			);
		});

		test("Should handle empty query parameters with userId", async () => {
			// Arrange
			const createdOrder = await createOrder(generateMockInsertOrder());
			const mockUser = generateMockSelectUser(createdOrder.user);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: mockUser.id };
			// @ts-expect-error - test case
			req.query = {};
			res.locals.user = mockUser;

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
		});

		test("Should convert totalPrice from cents to dollars in response when retrieving orders by user id", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();

			const createdOrders = await createOrders(
				generateMockInsertOrders(2, {
					user: mockUser,
				}),
			);

			const expectedData = createdOrders.map(convertOrderToDollars);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: mockUser.id };
			req.query = { pageNumber: "1", pageSize: "10" };
			res.locals.user = mockUser;

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);

			response.data.forEach((order) => {
				const originalOrder = expectedData.find((o) => o.id === order.id);

				assert.strictEqual(order.totalPrice, originalOrder?.totalPrice);
			});
		});

		test("Should return 403 when different user requests another user's orders", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser();

			await createOrders(generateMockInsertOrders(2, { user: orderOwner }));

			const differentUser = generateMockSelectUser({ isAdmin: false });

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: orderOwner.id };
			req.query = { pageNumber: "1", pageSize: "10" };
			res.locals.user = differentUser;

			// Act & Assert
			await assert.rejects(
				async () => await controller.getAllByUserId(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof ForbiddenError);
					assert.strictEqual(
						error.message,
						"You are not authorized to access this resource.",
					);
					return true;
				},
			);
		});

		test("Should return 200 when admin requests another user's orders", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser();

			await createOrders(generateMockInsertOrders(2, { user: orderOwner }));

			const adminUser = generateMockSelectUser({ isAdmin: true });

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: orderOwner.id };
			req.query = { pageNumber: "1", pageSize: "10" };
			res.locals.user = adminUser;

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);

			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, 2);
			assert.strictEqual(response.meta.totalItems, 2);
		});
	});

	describe("updatePayment", () => {
		test("Should return success response when called with valid order and payment data", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({
					status: "processing",
				}),
			);

			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.updatePayment,
			);
			req.params = { orderId };
			req.body = {
				id: "cs_456",
				provider: "stripe",
				sessionURL: "https://checkout.stripe.com/c/pay/cs_456",
			};

			// Act
			await controller.updatePayment(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when called with valid data", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({
					status: "processing",
				}),
			);

			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.updatePayment,
			);
			req.params = { orderId };
			req.body = {
				id: "cs_456",
				provider: "stripe",
				sessionURL: "https://checkout.stripe.com/c/pay/cs_456",
			};

			// Act
			await controller.updatePayment(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should update payment and persist to database when called with existing order", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({
					status: "processing",
				}),
			);

			const orderId = createdOrder.id;
			const paymentId = "cs_456";
			const provider = "stripe";
			const sessionURL = "https://checkout.stripe.com/c/pay/cs_456";

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.updatePayment,
			);
			req.params = { orderId };
			req.body = { id: paymentId, provider, sessionURL };

			// Act
			await controller.updatePayment(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);

			assert.strictEqual(response.data.payment?.sessionURL, sessionURL);

			const order = await orderRepository.getById({ orderId });
			assert.ok(order.success);
			assert.ok(order.data);
			assert.strictEqual(order.data.payment?.id, paymentId);
			assert.strictEqual(order.data.payment?.provider, provider);
			assert.strictEqual(order.data.payment?.sessionURL, sessionURL);
		});

		test("Should return updated order with payment in response", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({
					status: "processing",
				}),
			);

			const orderId = createdOrder.id;
			const paymentId = "cs_456";
			const sessionURL = "https://checkout.stripe.com/c/pay/cs_456";

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.updatePayment,
			);
			req.params = { orderId };
			req.body = { id: paymentId, provider: "stripe", sessionURL };

			// Act
			await controller.updatePayment(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.data.payment);
			assert.strictEqual(response.data.payment.id, paymentId);
			assert.strictEqual(response.data.payment.provider, "stripe");
			assert.strictEqual(response.data.payment.sessionURL, sessionURL);
		});

		test("Should throw 'NotFoundError' when called with non-existent order id", async () => {
			// Arrange
			const orderId = generateMockObjectId();

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.updatePayment,
			);
			req.params = { orderId };
			req.body = {
				id: "cs_123",
				provider: "stripe",
				sessionURL: "https://checkout.stripe.com/c/pay/cs_123",
			};

			// Act & Assert
			await assert.rejects(
				async () => await controller.updatePayment(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Order not found");
					return true;
				},
			);
		});

		test("Should add payment to order that had no payment", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({
					payment: undefined,
					status: "pending",
				}),
			);

			const orderId = createdOrder.id;
			const paymentId = "cs_123";
			const provider = "stripe";
			const sessionURL = "https://checkout.stripe.com/c/pay/cs_123";

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.updatePayment,
			);
			req.params = { orderId };
			req.body = { id: paymentId, provider, sessionURL };

			// Act
			await controller.updatePayment(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.payment?.id, paymentId);
			assert.strictEqual(response.data.payment?.provider, provider);
			assert.strictEqual(response.data.payment?.sessionURL, sessionURL);

			const foundOrder = await orderRepository.getById({ orderId });
			assert.ok(foundOrder.success);
			assert.ok(foundOrder.data);
			assert.strictEqual(foundOrder.data.payment?.id, paymentId);
			assert.strictEqual(foundOrder.data.payment?.provider, provider);
			assert.strictEqual(foundOrder.data.payment?.sessionURL, sessionURL);
		});

		test("Should convert all price fields from cents to dollars in response", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "processing" }),
			);

			const orderId = createdOrder.id;
			const expectedData = convertOrderToDollars(createdOrder);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.updatePayment,
			);
			req.params = { orderId };
			req.body = {
				id: "cs_456",
				provider: "stripe",
				sessionURL: "https://checkout.stripe.com/c/pay/cs_456",
			};

			// Act
			await controller.updatePayment(req, res, next);

			// Assert
			const response = res._getJSONData() as SuccessResponse<{
				data: typeof createdOrder;
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

	describe("markAsDelivered", () => {
		test("Should return 200 and mark order as delivered when order exists", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "processing" }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.markAsDelivered,
			);
			req.params = { orderId };

			// Act
			await controller.markAsDelivered(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);

			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.status, "delivered");
			assert.ok(response.data.deliveredAt);
		});

		test("Should persist delivered status to database when order is marked as delivered", async () => {
			// Arrange
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "processing" }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.markAsDelivered,
			);
			req.params = { orderId };

			// Act
			await controller.markAsDelivered(req, res, next);

			// Assert
			const dbOrder = await orderRepository.getById({ orderId });
			assert.ok(dbOrder.success);
			assert.ok(dbOrder.data);
			assert.strictEqual(dbOrder.data.status, "delivered");
		});

		test("Should throw NotFoundError when order does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.markAsDelivered,
			);
			req.params = { orderId: nonExistentId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.markAsDelivered(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof Error);
					assert.ok(error.message.toLowerCase().includes("order"));
					return true;
				},
			);
		});
	});

	describe("cancelOrder (user)", () => {
		test("Should return 200 and cancel a pending order when the owner requests it", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser({ isAdmin: false });
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "pending", user: orderOwner }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.cancelOrder,
			);
			req.params = { orderId };
			res.locals.user = orderOwner;

			// Act
			await controller.cancelOrder(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);

			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.status, "cancelled");
		});

		test("Should persist cancelled status to database when user cancels a pending order", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser({ isAdmin: false });
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "pending", user: orderOwner }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.cancelOrder,
			);
			req.params = { orderId };
			res.locals.user = orderOwner;

			// Act
			await controller.cancelOrder(req, res, next);

			// Assert
			const dbOrder = await orderRepository.getById({ orderId });
			assert.ok(dbOrder.success);
			assert.ok(dbOrder.data);
			assert.strictEqual(dbOrder.data.status, "cancelled");
		});

		test("Should throw ValidationError when the order status is not pending", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser({ isAdmin: false });
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "processing", user: orderOwner }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.cancelOrder,
			);
			req.params = { orderId };
			res.locals.user = orderOwner;

			// Act & Assert
			await assert.rejects(
				async () => await controller.cancelOrder(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof ValidationError);
					return true;
				},
			);
		});

		test("Should throw ForbiddenError when a different non-admin user tries to cancel the order", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser({ isAdmin: false });
			const anotherUser = generateMockSelectUser({ isAdmin: false });
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "pending", user: orderOwner }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.cancelOrder,
			);
			req.params = { orderId };
			res.locals.user = anotherUser;

			// Act & Assert
			await assert.rejects(
				async () => await controller.cancelOrder(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof ForbiddenError);
					return true;
				},
			);
		});
	});

	describe("adminCancelOrder", () => {
		test("Should return 200 and cancel any user's pending order when admin requests it", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser({ isAdmin: false });
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "pending", user: orderOwner }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.adminCancelOrder,
			);
			req.params = { orderId };

			// Act
			await controller.adminCancelOrder(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);

			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.status, "cancelled");
		});

		test("Should persist cancelled status to database when admin cancels a pending order", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser({ isAdmin: false });
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "pending", user: orderOwner }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.adminCancelOrder,
			);
			req.params = { orderId };

			// Act
			await controller.adminCancelOrder(req, res, next);

			// Assert
			const dbOrder = await orderRepository.getById({ orderId });
			assert.ok(dbOrder.success);
			assert.ok(dbOrder.data);
			assert.strictEqual(dbOrder.data.status, "cancelled");
		});

		test("Should throw ValidationError when the order status is not pending", async () => {
			// Arrange
			const orderOwner = generateMockSelectUser({ isAdmin: false });
			const createdOrder = await createOrder(
				generateMockInsertOrder({ status: "processing", user: orderOwner }),
			);
			const orderId = createdOrder.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.adminCancelOrder,
			);
			req.params = { orderId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.adminCancelOrder(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof ValidationError);
					return true;
				},
			);
		});

		test("Should throw NotFoundError when the order does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.adminCancelOrder,
			);
			req.params = { orderId: nonExistentId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.adminCancelOrder(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof Error);
					assert.ok(error.message.toLowerCase().includes("order"));
					return true;
				},
			);
		});
	});

	describe("handleStripeWebhook", () => {
		test("Should return 400 when 'stripe-signature' header is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.handleStripeWebhook,
			);
			req.body = Buffer.from("test-payload");

			// Act
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 400);

			const response = res._getJSONData();
			assert.strictEqual(response.success, false);
			assert.ok(response.errors);
		});

		test("Should return 400 when 'stripe-signature' header is an array instead of string", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.handleStripeWebhook,
			);
			req.body = Buffer.from("test-payload");
			req.headers["stripe-signature"] = ["sig1", "sig2"];

			// Act
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 400);

			const response = res._getJSONData();
			assert.strictEqual(response.success, false);
			assert.ok(response.errors);
		});

		test("Should return 400 when body is not a Buffer", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.handleStripeWebhook,
			);
			req.body = { notABuffer: true };
			req.headers["stripe-signature"] = "valid-signature";

			// Act
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 400);

			const response = res._getJSONData();
			assert.strictEqual(response.success, false);
			assert.ok(response.errors);
		});

		test("Should return 400 with appropriate error message when body is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.handleStripeWebhook,
			);
			req.body = undefined;
			req.headers["stripe-signature"] = "valid-signature";

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
