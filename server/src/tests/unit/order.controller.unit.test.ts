import type { Request, Response } from "express";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

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

		const userId = mockInsertOrder.user;

		test("Should parse 'order data' from 'req.body' and 'userId' from 'res.locals'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userId.toString() } } },
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

			assert.strictEqual(mockService.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.create.mock.calls[0].arguments[0],
				mockInsertOrder,
			);
		});

		test("Should call 'res.status' once with '201' after successfully creating order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertOrder },
				res: { locals: { user: { _id: userId.toString() } } },
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
				res: { locals: { user: { _id: userId.toString() } } },
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

		test("Should call 'service.getAll' once without args", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.getAll(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);

			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.strictEqual(mockService.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should call'res.status' once with '200' after successfully fetching all orders", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing all orders", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrders }),
			);
		});
	});

	describe("getAllByUserId", () => {
		const mockOrders = generateMockSelectOrders(2);
		const userId = mockOrders[0].user._id;

		test("Should parse 'userId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.getAllByUserId(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.getAllByUserId' once with the correct 'userId'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0],
				{
					userId: userId.toString(),
				},
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching all orders", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing all orders", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrders, success: true }),
			);

			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrders }),
			);
		});
	});

	describe("getById", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should parse 'orderId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.getById(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.getById' once with the correct 'orderId'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.getById.mock.calls[0].arguments[0], {
				orderId: orderId.toString(),
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrder }),
			);
		});
	});

	describe("updateToPaid", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should parse 'orderId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

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
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.updateToPaid(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.updateToPaid.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.updateToPaid.mock.calls[0].arguments[0],
				{
					orderId: orderId.toString(),
				},
			);
		});

		test("Should call 'res.status' once with '200' after successfully updating order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.updateToPaid(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.updateToPaid.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.updateToPaid(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrder }),
			);
		});
	});

	describe("updateToDelivered", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should parse 'orderId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

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
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.updateToDelivered(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.updateToDelivered.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.updateToDelivered.mock.calls[0].arguments[0],
				{
					orderId: orderId.toString(),
				},
			);
		});

		test("Should call 'res.status' once with '200' after successfully updating order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.updateToDelivered(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing order data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { orderId: orderId.toString() } },
				testContext: t,
			});

			mockService.updateToDelivered.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockOrder, success: true }),
			);

			await controller.updateToDelivered(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockOrder }),
			);
		});
	});
});
