import type { Request, Response } from "express";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";

import type { InsertUser } from "../../types/index.js";

import { UserController } from "../../controllers/index.js";
import { NotFoundError } from "../../errors/index.js";
import { createStrictSuccessResponseObject } from "../../utils/index.js";
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
		const userId = mockUser._id;

		test("Should parse 'userId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
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

		test("Should parse 'userId' from 'res.locals'", async (t) => {
			const { next, req, res } = mockExpressCall({
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
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

		test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
			const invalidUserId = "invalid-user-id";

			const { next, req, res } = mockExpressCall({
				req: { params: { userId: invalidUserId } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.getById(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Invalid ObjectId format.",
					);
					return true;
				},
			);
		});

		test("Should call 'service.getById' once with the correct 'userId'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.getById.mock.calls[0].arguments[0], {
				userId,
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({ data: mockUser }),
			);
		});
	});

	describe("getAll", () => {
		const mockUsers = generateMockSelectUsers({ count: 5 });

		test("Should call 'service.getAll' once without args", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUsers),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.strictEqual(mockService.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should call'res.status' once with '200' after successfully fetching all users", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUsers),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing all users", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUsers),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({ data: mockUsers }),
			);
		});
	});

	describe("update", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id;

		test("Should parse 'userId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.updateById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await assert.doesNotReject(
				async () =>
					await controller.update(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should parse 'userId' from 'res.locals'", async (t) => {
			const { next, req, res } = mockExpressCall({
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			mockService.updateById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await assert.doesNotReject(
				async () =>
					await controller.update(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
			const invalidUserId = "invalid-user-id";

			const { next, req, res } = mockExpressCall({
				req: { params: { userId: invalidUserId } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.update(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Invalid ObjectId format.",
					);
					return true;
				},
			);
		});

		test("Should call 'service.updateById' once with the correct 'userId'", async (t) => {
			const updateData: Partial<InsertUser> = { name: "new-name" };

			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { userId: userId.toString() },
				},
				testContext: t,
			});

			mockService.updateById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.updateById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.updateById.mock.calls[0].arguments[0],
				{
					data: updateData,
					userId,
				},
			);
		});

		test("Should call 'res.status' once with '200' after successfully updating user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.updateById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.updateById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({ data: mockUser }),
			);
		});
	});

	describe("delete", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id;

		test("Should parse 'userId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await assert.doesNotReject(
				async () =>
					await controller.delete(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
			const invalidUserId = "invalid-user-id";

			const { next, req, res } = mockExpressCall({
				req: { params: { userId: invalidUserId } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.delete(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Invalid ObjectId format.",
					);
					return true;
				},
			);
		});

		test("Should call 'service.delete' once with the correct 'userId'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.delete.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.delete.mock.calls[0].arguments[0], {
				userId,
			});
		});

		test("Should throw 'NotFoundError' if 'service.delete' returns 'null'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				// @ts-expect-error - test case
				Promise.resolve(null),
			);

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
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
		});

		test("Should call 'res.json' once with the success response object containing user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({ data: null }),
			);
		});
	});
});
