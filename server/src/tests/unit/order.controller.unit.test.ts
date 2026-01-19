import type { Request, Response } from "express";

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

suite("Order Controller 〖 Unit Tests 〗", () => {
	const mockService = mockOrderService();
	const controller = new OrderController(mockService);

	beforeEach(() => {
		mockService.reset();
	});

	describe("create", () => {
		const mockInsertOrder = generateMockInsertOrder();
		const mockSelectOrder = generateMockSelectOrder();
		mockSelectOrder.user._id = mockInsertOrder.user;

		const userId = mockInsertOrder.user.toString();

		test("Should parse 'order data' from 'req.body' and 'userId' from 'res.locals'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.create' once with the correct 'order data'", async (t) => {
			const userIdObject = new Types.ObjectId(userId);
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userIdObject } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.create.mock.calls[0].arguments[0],
				mockInsertOrder,
			);
		});

		test("Should call 'res.status' once with '201' after successfully creating order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectOrder, success: true }),
			);

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockSelectOrder }),
			);
		});
	});

	describe("getAll", () => {
		const mockOrders = generateMockSelectOrders(5);
		const mockMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: mockOrders.length,
			totalPages: 1,
		};
		const mockPaginatedResponse = {
			items: mockOrders,
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
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: mockPaginatedResponse.items,
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
		const mockOrders = generateMockSelectOrders(2);
		const userId = mockOrders[0].user._id.toString();
		const mockMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: mockOrders.length,
			totalPages: 1,
		};
		const mockPaginatedResponse = {
			items: mockOrders,
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
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: mockPaginatedResponse.items,
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
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();

		test("Should call 'service.getById' once with the correct 'orderId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
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
				Promise.resolve({ data: mockOrder, success: true }),
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

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
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
				createSuccessResponseObject({ data: mockOrder }),
			);
		});
	});

	describe("updateToPaid", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();

		test("Should parse 'orderId' from 'req.params'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			await assert.doesNotReject(
				async () =>
					await controller.updateToPaid(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);

			// Assert
			// Test passes if no error is thrown
		});

		test("Should call 'service.updateToPaid' once with the correct 'orderId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
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

		test("Should call 'res.status' once with '200' after successfully updating order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
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
				Promise.resolve({ data: mockOrder, success: true }),
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
				createSuccessResponseObject({ data: mockOrder }),
			);
		});
	});

	describe("updateToDelivered", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id.toString();

		test("Should parse 'orderId' from 'req.params'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			// Act
			await assert.doesNotReject(
				async () =>
					await controller.updateToDelivered(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);

			// Assert
			// Test passes if no error is thrown
		});

		test("Should call 'service.updateToDelivered' once with the correct 'orderId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
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

		test("Should call 'res.status' once with '200' after successfully updating order data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
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
				Promise.resolve({ data: mockOrder, success: true }),
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
				createSuccessResponseObject({ data: mockOrder }),
			);
		});
	});
});
