import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import { OrderController } from "../../controllers/index.js";
import { ForbiddenError } from "../../errors/index.js";
import type { SuccessResponse } from "../../types/index.js";
import { createSuccessResponseObject } from "../../utils/index.js";
import {
	generateMockCheckoutSessionResponse,
	generateMockInsertOrder,
	generateMockObjectId,
	generateMockSelectOrder,
	generateMockSelectOrders,
	mockExpressCall,
	mockOrderManager,
} from "../mocks/index.js";
import {
	convertOrderToCents,
	convertOrderToDollars,
	toDollars,
} from "../utils/index.js";

suite("Order Controller 〖 Unit Tests 〗", () => {
	const mockManager = mockOrderManager();
	const controller = new OrderController(mockManager);

	beforeEach(() => {
		mockManager.reset();
	});

	describe("create", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockInsertOrderInCents = convertOrderToCents(mockInsertOrder);
		const mockSelectOrder = generateMockSelectOrder(mockInsertOrderInCents);
		const mockSelectOrderInDollars = convertOrderToDollars(mockSelectOrder);

		const mockSession = generateMockCheckoutSessionResponse();

		const userId = mockInsertOrderInCents.user.id;

		test("Should parse 'order data' from 'req.body' and 'userId' from 'res.locals'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { order: mockSelectOrder, session: mockSession },
					success: true,
				}),
			);

			// Act & Assert
			await assert.doesNotReject(
				async () =>
					// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
					await controller.create(req, res, next),
			);
		});

		test("Should convert order prices from dollars to cents before calling manager", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: mockInsertOrder.user } },
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { order: mockSelectOrder, session: mockSession },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.create(req, res, next);

			// Assert
			assert.strictEqual(mockManager.create.mock.callCount(), 1);

			const args = mockManager.create.mock.calls[0].arguments[0];
			assert.strictEqual(args.itemsPrice, mockSelectOrder.itemsPrice);
			assert.strictEqual(args.shippingPrice, mockSelectOrder.shippingPrice);
			assert.strictEqual(args.taxPrice, mockSelectOrder.taxPrice);
			assert.strictEqual(args.totalPrice, mockSelectOrder.totalPrice);
			assert.strictEqual(
				args.orderItems[0].price,
				mockSelectOrder.orderItems[0].price,
			);
		});

		test("Should convert order prices from cents to dollars in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { order: mockSelectOrder, session: mockSession },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.create(req, res, next);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: { order: typeof mockSelectOrder; session: typeof mockSession };
			}>;

			assert.strictEqual(
				response.data.order.itemsPrice,
				mockSelectOrderInDollars.itemsPrice,
			);
			assert.strictEqual(
				response.data.order.shippingPrice,
				mockSelectOrderInDollars.shippingPrice,
			);
			assert.strictEqual(
				response.data.order.taxPrice,
				mockSelectOrderInDollars.taxPrice,
			);
			assert.strictEqual(
				response.data.order.totalPrice,
				mockSelectOrderInDollars.totalPrice,
			);
			assert.strictEqual(
				response.data.order.orderItems[0].price,
				mockSelectOrderInDollars.orderItems[0].price,
			);
		});

		test("Should include session URL in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { order: mockSelectOrder, session: mockSession },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.create(req, res, next);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: { order: typeof mockSelectOrder; session: typeof mockSession };
			}>;

			assert.ok(response.data.session);
			assert.strictEqual(response.data.session.url, mockSession.url);
		});

		test("Should call 'res.status' once with '201' after successfully creating order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { order: mockSelectOrder, session: mockSession },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.create(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
		});

		test("Should call 'res.json' once with the success response object containing order and session data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { order: mockSelectOrder, session: mockSession },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.create(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: {
					order: mockSelectOrderInDollars,
					session: mockSession,
				},
				success: true,
			});
		});
	});

	describe("getAll", () => {
		const mockOrdersInDollars = generateMockSelectOrders(5);
		const mockOrdersInCents = mockOrdersInDollars.map((order) =>
			convertOrderToCents(order),
		);

		const mockMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: mockOrdersInCents.length,
			totalPages: 1,
		};
		const mockPaginatedResponse = {
			items: mockOrdersInCents,
			meta: mockMeta,
		};

		test("Should call 'service.getAll' once with query parameters", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.strictEqual(mockManager.getAll.mock.calls[0].arguments.length, 1);
		});

		test("Should pass query parameters to service.getAll", async (t) => {
			// Arrange
			const queryParams = {
				pageNumber: "2",
				pageSize: "5",
				sort: "createdAt:desc",
			};
			const { next, req, res } = mockExpressCall({
				req: { query: queryParams },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockManager.getAll.mock.calls[0].arguments[0], {
				filters: { status: undefined },
				pageNumber: "2",
				pageSize: "5",
				sort: "createdAt:desc",
			});
		});

		test("Should pass status in filters to service.getAll when present in query", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					query: { pageNumber: "1", status: "processing" },
				},
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockManager.getAll.mock.calls[0].arguments[0], {
				filters: { status: "processing" },
				pageNumber: "1",
				pageSize: undefined,
				sort: undefined,
			});
		});

		test("Should convert order prices from cents to dollars for all orders in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockOrdersInCents;
			}>;

			response.data.forEach((order, index) => {
				assert.strictEqual(
					order.totalPrice.toFixed(2),
					mockOrdersInDollars[index].totalPrice.toFixed(2),
				);
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching orders", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with paginated response structure", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);

			const expectedPaginatedItems = mockOrdersInCents.map((order) => ({
				...order,
				totalPrice: toDollars(order.totalPrice),
			}));
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: expectedPaginatedItems,
				meta: mockPaginatedResponse.meta,
				success: true,
			});
		});

		test("Should handle empty query parameters", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: {} },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockManager.getAll.mock.calls[0].arguments[0], {
				filters: { status: undefined },
				pageNumber: undefined,
				pageSize: undefined,
				sort: undefined,
			});
		});
	});

	describe("getAllByUserId", () => {
		const mockOrdersInDollars = generateMockSelectOrders(2);
		const mockOrdersInCents = mockOrdersInDollars.map((order) =>
			convertOrderToCents(order),
		);
		const userId = mockOrdersInDollars[0].user.id;

		const mockMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: mockOrdersInCents.length,
			totalPages: 1,
		};
		const mockPaginatedResponse = {
			items: mockOrdersInCents,
			meta: mockMeta,
		};

		test("Should parse 'userId' from 'req.params' and query from 'req.query'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.strictEqual(
				mockManager.getAll.mock.calls[0].arguments[0].filters?.userId,
				userId,
			);
		});

		test("Should call 'service.getAll' once with params", async (t) => {
			// Arrange
			const queryParams = {
				pageNumber: "2",
				pageSize: "5",
				sort: "createdAt:desc",
			};

			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: queryParams,
				},
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);

			assert.deepStrictEqual(
				mockManager.getAll.mock.calls[0].arguments[0].pageNumber,
				queryParams.pageNumber,
			);
			assert.deepStrictEqual(
				mockManager.getAll.mock.calls[0].arguments[0].pageSize,
				queryParams.pageSize,
			);
			assert.deepStrictEqual(
				mockManager.getAll.mock.calls[0].arguments[0].sort,
				queryParams.sort,
			);
			assert.strictEqual(
				mockManager.getAll.mock.calls[0].arguments[0].filters?.userId,
				userId,
			);
		});

		test("Should convert totalPrice from cents to dollars for all orders in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockOrdersInDollars;
			}>;

			response.data.forEach((order, index) => {
				assert.strictEqual(
					order.totalPrice.toFixed(2),
					mockOrdersInDollars[index].totalPrice.toFixed(2),
				);
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching user orders", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with paginated response structure", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			const expectedPaginatedItems = mockOrdersInCents.map((order) => ({
				...order,
				totalPrice: toDollars(order.totalPrice),
			}));
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: expectedPaginatedItems,
				meta: mockPaginatedResponse.meta,
				success: true,
			});
		});

		test("Should handle empty query parameters with userId", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: {},
				},
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.strictEqual(
				mockManager.getAll.mock.calls[0].arguments[0].filters?.userId,
				userId,
			);
		});

		test("Should throw ForbiddenError when localUser is undefined", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				res: { locals: {} },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act & Assert
			await assert.rejects(
				// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
				async () => await controller.getAllByUserId(req, res, next),
				ForbiddenError,
			);
		});

		test("Should throw ForbiddenError when localUser does not match userId and is not admin", async (t) => {
			// Arrange
			const differentUserId = generateMockObjectId();
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				res: { locals: { user: { id: differentUserId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act & Assert
			await assert.rejects(
				// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
				async () => await controller.getAllByUserId(req, res, next),
				ForbiddenError,
			);
		});

		test("Should allow access when localUser is admin even if userId doesn't match", async (t) => {
			// Arrange
			const adminUserId = generateMockObjectId();
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				res: { locals: { user: { id: adminUserId, isAdmin: true } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should allow access when localUser matches userId", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});
	});

	describe("getById", () => {
		const mockSelectOrder = generateMockSelectOrder();

		const mockOrderInCents = convertOrderToCents(mockSelectOrder);
		const mockOrderInDollars = convertOrderToDollars(mockOrderInCents);
		const orderId = mockOrderInCents.id;
		const orderOwnerId = mockOrderInCents.user.id;

		test("Should call 'service.getById' once with the correct 'orderId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				res: { locals: { user: { id: orderOwnerId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockManager.getById.mock.calls[0].arguments[0].orderId,
				orderId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				res: { locals: { user: { id: orderOwnerId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should convert order prices from cents to dollars in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				res: { locals: { user: { id: orderOwnerId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockOrderInCents;
			}>;

			assert.strictEqual(
				response.data.itemsPrice,
				mockOrderInDollars.itemsPrice,
			);
			assert.strictEqual(
				response.data.shippingPrice,
				mockOrderInDollars.shippingPrice,
			);
			assert.strictEqual(response.data.taxPrice, mockOrderInDollars.taxPrice);
			assert.strictEqual(
				response.data.totalPrice,
				mockOrderInDollars.totalPrice,
			);
			assert.strictEqual(
				response.data.orderItems[0].price,
				mockOrderInDollars.orderItems[0].price,
			);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				res: { locals: { user: { id: orderOwnerId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrderInDollars }),
			);
		});

		test("Should throw ForbiddenError when localUser is undefined", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				res: { locals: {} },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act & Assert
			await assert.rejects(
				// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
				async () => await controller.getById(req, res, next),
				ForbiddenError,
			);
		});

		test("Should throw ForbiddenError when localUser does not match order owner and is not admin", async (t) => {
			// Arrange
			const differentUserId = generateMockObjectId();
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				res: { locals: { user: { id: differentUserId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act & Assert
			await assert.rejects(
				// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
				async () => await controller.getById(req, res, next),
				ForbiddenError,
			);
		});

		test("Should allow access when localUser is admin even if order belongs to different user", async (t) => {
			// Arrange
			const adminUserId = generateMockObjectId();
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				res: { locals: { user: { id: adminUserId, isAdmin: true } } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getById.mock.callCount(), 1);
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should allow access when localUser matches order owner", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				res: { locals: { user: { id: orderOwnerId, isAdmin: false } } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.strictEqual(mockManager.getById.mock.callCount(), 1);
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});
	});

	describe("updatePayment", () => {
		const mockSelectOrder = generateMockSelectOrder({
			status: "processing",
		});

		const mockOrderInCents = convertOrderToCents(mockSelectOrder);
		const mockOrderInDollars = convertOrderToDollars(mockOrderInCents);
		const orderId = mockOrderInCents.id;
		const paymentBody = mockSelectOrder.payment;

		test("Should parse 'orderId' from 'req.params' and payment from 'req.body'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: paymentBody,
					params: { orderId },
				},
				testContext: t,
			});

			mockManager.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act & Assert
			await assert.doesNotReject(
				// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response & Assert
				async () => await controller.updatePayment(req, res, next),
			);
		});

		test("Should call 'manager.updatePayment' once with the correct 'orderId' and merged payment body", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: paymentBody,
					params: { orderId },
				},
				testContext: t,
			});

			mockManager.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.updatePayment(req, res, next);

			// Assert
			assert.strictEqual(mockManager.updatePayment.mock.callCount(), 1);

			assert.ok(paymentBody);

			const args = mockManager.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.orderId, orderId);
			assert.strictEqual(args.id, paymentBody.id);
			assert.strictEqual(args.provider, paymentBody.provider);
			assert.strictEqual(args.sessionURL, paymentBody.sessionURL);
		});

		test("Should pass sessionURL from req.body to manager when provided", async (t) => {
			// Arrange
			const sessionURL = "https://checkout.stripe.com/c/pay/cs_test_123";
			const paymentBodyWithSessionURL = {
				id: "cs_123",
				provider: "stripe" as const,
				sessionURL,
			};

			const { next, req, res } = mockExpressCall({
				req: {
					body: paymentBodyWithSessionURL,
					params: { orderId },
				},
				testContext: t,
			});

			mockManager.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.updatePayment(req, res, next);

			// Assert
			assert.strictEqual(mockManager.updatePayment.mock.callCount(), 1);

			const args = mockManager.updatePayment.mock.calls[0].arguments[0];
			assert.strictEqual(args.sessionURL, sessionURL);
		});

		test("Should convert order prices from cents to dollars in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: paymentBody,
					params: { orderId },
				},
				testContext: t,
			});

			mockManager.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.updatePayment(req, res, next);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockOrderInDollars;
			}>;

			assert.strictEqual(
				response.data.itemsPrice,
				mockOrderInDollars.itemsPrice,
			);
			assert.strictEqual(
				response.data.shippingPrice,
				mockOrderInDollars.shippingPrice,
			);
			assert.strictEqual(response.data.taxPrice, mockOrderInDollars.taxPrice);
			assert.strictEqual(
				response.data.totalPrice,
				mockOrderInDollars.totalPrice,
			);
			assert.strictEqual(
				response.data.orderItems[0].price,
				mockOrderInDollars.orderItems[0].price,
			);
		});

		test("Should call 'res.status' once with '200' after successfully updating payment", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: paymentBody,
					params: { orderId },
				},
				testContext: t,
			});

			mockManager.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.updatePayment(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: paymentBody,
					params: { orderId },
				},
				testContext: t,
			});

			mockManager.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.updatePayment(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrderInDollars }),
			);
		});

		test("Should throw error when 'manager.updatePayment' returns failure", async (t) => {
			// Arrange
			const mockError = new Error("Payment update failed");
			const { next, req, res } = mockExpressCall({
				req: {
					body: paymentBody,
					params: { orderId },
				},
				testContext: t,
			});

			mockManager.updatePayment.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: mockError, success: false }),
			);

			// Act & Assert
			await assert.rejects(
				// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
				async () => await controller.updatePayment(req, res, next),
				(error: Error) => {
					assert.strictEqual(error.message, "Payment update failed");
					return true;
				},
			);
		});
	});

	describe("handleStripeWebhook", () => {
		const mockPayload = Buffer.from("test-payload");
		const mockSignature = "test-signature";

		test("Should return 400 when 'stripe-signature' header is missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockPayload,
					headers: {},
				},
				testContext: t,
			});

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 400);
		});

		test("Should return 400 when 'stripe-signature' header is not a string", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockPayload,
					headers: { "stripe-signature": ["array", "value"] },
				},
				testContext: t,
			});

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 400);
		});

		test("Should return 400 when body is not a Buffer", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: { notABuffer: true },
					headers: { "stripe-signature": mockSignature },
				},
				testContext: t,
			});

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 400);
		});

		test("Should call 'manager.processPaymentWebhook' with correct params", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockPayload,
					headers: { "stripe-signature": mockSignature },
				},
				testContext: t,
			});

			mockManager.processPaymentWebhook.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			assert.strictEqual(mockManager.processPaymentWebhook.mock.callCount(), 1);

			const args = mockManager.processPaymentWebhook.mock.calls[0].arguments[0];
			assert.ok(Buffer.isBuffer(args.payload));
			assert.strictEqual(args.signature, mockSignature);
		});

		test("Should return 200 with success response on successful processing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockPayload,
					headers: { "stripe-signature": mockSignature },
				},
				testContext: t,
			});

			mockManager.processPaymentWebhook.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.handleStripeWebhook(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: { success: true },
				success: true,
			});
		});

		test("Should throw error when 'manager.processPaymentWebhook' fails", async (t) => {
			// Arrange
			const mockError = new Error("Webhook verification failed");
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockPayload,
					headers: { "stripe-signature": mockSignature },
				},
				testContext: t,
			});

			mockManager.processPaymentWebhook.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: mockError, success: false }),
			);

			// Act & Assert
			await assert.rejects(
				// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
				async () => await controller.handleStripeWebhook(req, res, next),
				(error: Error) => {
					assert.strictEqual(error.message, "Webhook verification failed");
					return true;
				},
			);
		});
	});
});
