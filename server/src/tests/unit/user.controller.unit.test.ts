import type { Request, Response } from "express";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import type { InsertUser } from "../../types/index.js";

import { UserController } from "../../controllers/index.js";
import { NotFoundError } from "../../errors/index.js";
import { createSuccessResponseObject } from "../../utils/index.js";
import {
	generateMockSelectUser,
	generateMockSelectUsers,
	mockExpressCall,
	mockUserService,
} from "../mocks/index.js";

suite("User Controller 〖 Unit Tests 〗", () => {
	const mockService = mockUserService();
	const controller = new UserController(mockService);

	beforeEach(() => {
		mockService.reset();
	});

	describe("getById", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id.toString();

		test("Should call 'service.getById' once with the correct 'userId'", async (t) => {
			// Arrange

			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
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
				mockService.getById.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching user data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
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

		test("Should call 'res.json' once with the success response object containing user data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
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
				createSuccessResponseObject({ data: mockUser }),
			);
		});
	});

	describe("getAll", () => {
		const mockUsers = generateMockSelectUsers({ count: 5 });

		const mockPaginatedMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 5,
			totalItems: 5,
			totalPages: 1,
		};

		const mockGetAllSuccess = () =>
			Promise.resolve({
				data: {
					items: mockUsers,
					meta: mockPaginatedMeta,
				},
				success: true,
			} as const);

		test("Should call 'service.getAll' once with the correct 'args'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(mockGetAllSuccess);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);

			const callArgs = mockService.getAll.mock.calls[0].arguments[0];
			assert.strictEqual(callArgs.pageNumber, "1");
			assert.strictEqual(callArgs.pageSize, undefined);
			assert.strictEqual(callArgs.sort, undefined);
			assert.deepStrictEqual(callArgs.filters, {
				email: undefined,
				isAdmin: undefined,
				name: undefined,
			});
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

			mockService.getAll.mock.mockImplementationOnce(mockGetAllSuccess);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);

			const callArgs = mockService.getAll.mock.calls[0].arguments[0];
			assert.strictEqual(callArgs.pageNumber, "2");
			assert.strictEqual(callArgs.pageSize, "5");
			assert.strictEqual(callArgs.sort, "createdAt:desc");
			assert.deepStrictEqual(callArgs.filters, {
				email: undefined,
				isAdmin: undefined,
				name: undefined,
			});
		});

		test("Should pass email, isAdmin, and name in filters to service.getAll when present in query", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						email: "a@b.com",
						isAdmin: "true",
						name: "Jane",
						pageNumber: "1",
					},
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(mockGetAllSuccess);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);

			const callArgs = mockService.getAll.mock.calls[0].arguments[0];
			assert.strictEqual(callArgs.pageNumber, "1");
			assert.strictEqual(callArgs.pageSize, undefined);
			assert.strictEqual(callArgs.sort, undefined);
			assert.deepStrictEqual(callArgs.filters, {
				email: "a@b.com",
				isAdmin: "true",
				name: "Jane",
			});
		});

		test("Should handle empty query parameters", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: {} },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(mockGetAllSuccess);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);

			const callArgs = mockService.getAll.mock.calls[0].arguments[0];
			assert.strictEqual(callArgs.pageNumber, undefined);
			assert.strictEqual(callArgs.pageSize, undefined);
			assert.strictEqual(callArgs.sort, undefined);
			assert.deepStrictEqual(callArgs.filters, {
				email: undefined,
				isAdmin: undefined,
				name: undefined,
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching all users", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(mockGetAllSuccess);

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

		test("Should call 'res.json' once with the success response object containing all users", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(mockGetAllSuccess);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({
					data: mockUsers,
					meta: mockPaginatedMeta,
				}),
			);
		});
	});

	describe("update", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id.toString();

		test("Should call 'service.updateById' once with the correct 'userId'", async (t) => {
			// Arrange
			const updateData: Partial<InsertUser> = { name: "new-name" };

			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { userId },
				},
				testContext: t,
			});

			mockService.updateById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.updateById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.updateById.mock.calls[0].arguments[0].userId,
				userId,
			);
			assert.deepStrictEqual(
				mockService.updateById.mock.calls[0].arguments[0].data,
				updateData,
			);
		});

		test("Should call 'res.status' once with '200' after successfully updating user data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.updateById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing user data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.updateById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockUser }),
			);
		});
	});

	describe("delete", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id.toString();

		test("Should call 'service.delete' once with the correct 'userId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.delete.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.delete.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should throw 'NotFoundError' if 'service.delete' returns failure result", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new NotFoundError("User"),
					success: false,
				}),
			);

			// Act & Assert
			await assert.rejects(
				async () =>
					await controller.delete(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				NotFoundError,
			);
		});

		test("Should call 'res.status' once with '204' after successfully deleting user data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
		});

		test("Should call 'res.json' once with the success response object containing null data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUser, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: null }),
			);
		});
	});
});
