import type { Request, Response } from "express";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";

import { AuthController } from "../../controllers/index.js";
import { DatabaseError } from "../../errors/index.js";
import { createSuccessResponseObject } from "../../utils/index.js";
import {
	generateMockInsertUser,
	generateMockSelectUser,
	mockAuthService,
	mockExpressCall,
} from "../mocks/index.js";

suite("Auth Controller 〖 Unit Tests 〗", () => {
	const mockService = mockAuthService();
	const controller = new AuthController(mockService);

	beforeEach(() => {
		mockService.reset();
	});

	describe("signup", () => {
		const mockInsertUser = generateMockInsertUser();
		const mockSelectUser = generateMockSelectUser({ ...mockInsertUser });

		test("Should parse 'user data' from 'req.body", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signup.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await assert.doesNotReject(
				async () =>
					await controller.signup(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should throw 'ZodError' if 'user.email' is invalid", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: { ...mockInsertUser, email: "invalid-email" } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.signup(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(error.issues[0].message, "Invalid email format.");
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'user.password' is less than 6 chars", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: { ...mockInsertUser, password: "12345" } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.signup(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Password should be at least 6 characters long.",
					);
					return true;
				},
			);
		});

		test("Should call 'service.signup' once with the correct 'user data'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signup.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await controller.signup(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			const expectedParsedData = {
				email: mockInsertUser.email.toLowerCase(),
				isAdmin: mockInsertUser.isAdmin,
				name: mockInsertUser.name,
				password: mockInsertUser.password, // TODO: why return password?!
			};

			assert.strictEqual(mockService.signup.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.signup.mock.calls[0].arguments[0],
				expectedParsedData,
			);
		});

		test("Should throw 'DatabaseError' if 'service.signup' throws", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signup.mock.mockImplementationOnce(() =>
				Promise.reject(new DatabaseError()),
			);

			await assert.rejects(
				async () =>
					await controller.signup(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				DatabaseError,
			);
		});

		test("Should call 'res.status' once with '201' after successfully fetching user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signup.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await controller.signup(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
		});

		test("Should call 'res.json' once with the success response object containing user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signup.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await controller.signup(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockSelectUser }),
			);
		});
	});

	describe("signin", () => {
		const mockInsertUser = generateMockInsertUser();
		const mockSelectUser = generateMockSelectUser({ ...mockInsertUser });

		test("Should parse 'user data' from 'req.body", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signin.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await assert.doesNotReject(
				async () =>
					await controller.signin(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should parse 'user data' from 'res.locals'", async (t) => {
			const { next, req, res } = mockExpressCall({
				res: { locals: { user: mockInsertUser } },
				testContext: t,
			});

			mockService.signin.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await assert.doesNotReject(
				async () =>
					await controller.signin(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should throw 'ZodError' if 'user.password' is less than 6 chars", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: { ...mockInsertUser, password: "12345" } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.signin(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Password should be at least 6 characters long.",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'user.email' is invalid", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: { ...mockInsertUser, email: "invalid-email" } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.signin(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(error.issues[0].message, "Invalid email format.");
					return true;
				},
			);
		});

		test("Should call 'service.signin' once with the correct 'user data'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signin.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await controller.signin(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			const expectedParsedData = {
				email: mockInsertUser.email.toLowerCase(),
				password: mockInsertUser.password,
			};

			assert.strictEqual(mockService.signin.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.signin.mock.calls[0].arguments[0],
				expectedParsedData,
			);
		});

		test("Should throw 'DatabaseError' if 'service.signin' throws", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signin.mock.mockImplementationOnce(() =>
				Promise.reject(new DatabaseError()),
			);

			await assert.rejects(
				async () =>
					await controller.signin(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				DatabaseError,
			);
		});

		test("Should call 'res.status' once with '201' after successfully fetching user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signin.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await controller.signin(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing user data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { body: mockInsertUser },
				testContext: t,
			});

			mockService.signin.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await controller.signin(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockSelectUser }),
			);
		});
	});
});
