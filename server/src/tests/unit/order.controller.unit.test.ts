import type { Request, Response } from "express";
import type { SuccessResponse } from "../../types/index.js";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import { Types } from "mongoose";
import { OrderController } from "../../controllers/index.js";
import { createSuccessResponseObject } from "../../utils/index.js";
import {
	generateMockInsertOrder,
	generateMockSelectOrder,
	generateMockSelectOrders,
	mockExpressCall,
	mockOrderService,
} from "../mocks/index.js";
import {
	convertOrderToCents,
	convertOrderToDollars,
	toDollars,
} from "../utils/index.js";

suite("Order Controller 〖 Unit Tests 〗", () => {
	const mockService = mockOrderService();
	const controller = new OrderController(mockService);

	beforeEach(() => {
		mockService.reset();
	});

	describe("create", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockInsertOrderInCents = convertOrderToCents(mockInsertOrder);
		const mockSelectOrder = generateMockSelectOrder({
			...mockInsertOrderInCents,
			user: {
				_id: mockInsertOrderInCents.user,
				name: "example name",
				email: "email@example.com",
			},
		});
		const mockSelectOrderInDollars = convertOrderToDollars(mockSelectOrder);

		const userId = mockInsertOrderInCents.user.toString();

		test("Should parse 'order data' from 'req.body' and 'userId' from 'res.locals'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			// Act & Assert
			await assert.doesNotReject(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should convert order prices from dollars to cents before calling service", async (t) => {
			// Arrange
			const userIdObject = new Types.ObjectId(userId);
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userIdObject } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.create.mock.callCount(), 1);

			const args = mockService.create.mock.calls[0].arguments[0];
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
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockSelectOrder;
			}>;

			assert.strictEqual(
				response.data.itemsPrice,
				mockSelectOrderInDollars.itemsPrice,
			);
			assert.strictEqual(
				response.data.shippingPrice,
				mockSelectOrderInDollars.shippingPrice,
			);
			assert.strictEqual(
				response.data.taxPrice,
				mockSelectOrderInDollars.taxPrice,
			);
			assert.strictEqual(
				response.data.totalPrice,
				mockSelectOrderInDollars.totalPrice,
			);
			assert.strictEqual(
				response.data.orderItems[0].price,
				mockSelectOrderInDollars.orderItems[0].price,
			);
		});

		test("Should call 'res.status' once with '201' after successfully creating order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockSelectOrderInDollars }),
			);
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

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.strictEqual(mockService.getAll.mock.calls[0].arguments.length, 1);
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

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0],
				queryParams,
			);
		});

		test("Should convert order prices from cents to dollars for all orders in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.getAll.mock.calls[0].arguments[0], {});
		});
	});

	describe("getAllByUserId", () => {
		const mockOrdersInDollars = generateMockSelectOrders(2);
		const mockOrdersInCents = mockOrdersInDollars.map((order) =>
			convertOrderToCents(order),
		);
		const userId = mockOrdersInDollars[0].user._id.toString();

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
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0].user?.toString(),
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
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);

			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0].pageNumber,
				queryParams.pageNumber,
			);
			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0].pageSize,
				queryParams.pageSize,
			);
			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0].sort,
				queryParams.sort,
			);
		});

		test("Should convert totalPrice from cents to dollars for all orders in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0].user?.toString(),
				userId,
			);
		});
	});

	describe("getById", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockSelectOrder = generateMockSelectOrder({
			...mockInsertOrder,
			user: {
				_id: mockInsertOrder.user,
				email: "email@example.com",
				name: "name",
			},
		});

		const mockOrderInCents = convertOrderToCents(mockSelectOrder);
		const mockOrderInDollars = convertOrderToDollars(mockOrderInCents);
		const orderId = mockOrderInCents._id.toString();

		test("Should call 'service.getById' once with the correct 'orderId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getById.mock.calls[0].arguments[0].orderId.toString(),
				orderId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should convert order prices from cents to dollars in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrderInDollars }),
			);
		});
	});

	describe("updateToPaid", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockSelectOrder = generateMockSelectOrder({
			...mockInsertOrder,
			user: {
				_id: mockInsertOrder.user,
				email: "email@example.com",
				name: "name",
			},
		});

		const mockOrderInCents = convertOrderToCents(mockSelectOrder);
		const mockOrderInDollars = convertOrderToDollars(mockOrderInCents);
		const orderId = mockOrderInCents._id.toString();

		test("Should parse 'orderId' from 'req.params'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act & Assert
			await assert.doesNotReject(
				async () =>
					await controller.updateToPaid(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.updateToPaid' once with the correct 'orderId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.updateToPaid(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.updateToPaid.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.updateToPaid.mock.calls[0].arguments[0].orderId.toString(),

				orderId,
			);
		});

		test("Should convert order prices from cents to dollars in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.updateToPaid(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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

		test("Should call 'res.status' once with '200' after successfully updating order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.updateToPaid(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.updateToPaid(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrderInDollars }),
			);
		});
	});

	describe("updateToDelivered", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockSelectOrder = generateMockSelectOrder({
			...mockInsertOrder,
			user: {
				_id: mockInsertOrder.user,
				email: "email@example.com",
				name: "name",
			},
		});

		const mockOrderInCents = convertOrderToCents(mockSelectOrder);
		const mockOrderInDollars = convertOrderToDollars(mockOrderInCents);
		const orderId = mockOrderInCents._id.toString();

		test("Should parse 'orderId' from 'req.params'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act & Assert
			await assert.doesNotReject(
				async () =>
					await controller.updateToDelivered(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.updateToDelivered' once with the correct 'orderId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.updateToDelivered(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.updateToDelivered.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.updateToDelivered.mock.calls[0].arguments[0].orderId.toString(),
				orderId,
			);
		});

		test("Should convert order prices from cents to dollars in response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.updateToDelivered(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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

		test("Should call 'res.status' once with '200' after successfully updating order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.updateToDelivered(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrderInCents, success: true }),
			);

			// Act
			await controller.updateToDelivered(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrderInDollars }),
			);
		});
	});
});
