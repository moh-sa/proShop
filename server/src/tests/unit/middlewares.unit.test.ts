import assert from "node:assert";
import test, { describe, suite } from "node:test";

import type { NextFunction, Request, Response } from "express";

import {
	ForbiddenError,
	InternalError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import {
	authorizeAdmin,
	verifyReviewOwnership,
} from "../../middlewares/index.js";
import { ReviewService } from "../../services/index.js";
import { mockExpressCall } from "../mocks/index.js";

suite("Middlewares 〖 Unit Tests 〗", () => {
	describe("checkIfUserIsAdmin", () => {
		test("Should call next once when user is admin", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.user = { id: "507f1f77bcf86cd799439011", isAdmin: true };

			// Act
			await authorizeAdmin(
				req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction,
			);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next with InternalError when res.locals.user is missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () =>
					authorizeAdmin(
						req as unknown as Request,
						res as unknown as Response,
						next as unknown as NextFunction,
					),
				InternalError,
			);
		});

		test("Should call next with ForbiddenError when user is not admin", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.user = { id: "507f1f77bcf86cd799439011", isAdmin: false };

			// Act & Assert
			await assert.rejects(
				async () =>
					authorizeAdmin(
						req as unknown as Request,
						res as unknown as Response,
						next as unknown as NextFunction,
					),
				ForbiddenError,
			);
		});
	});

	describe("verifyReviewOwnership", () => {
		test("Should call next with InternalError when res.locals.user is missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: "507f1f77bcf86cd799439011" } },
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () =>
					verifyReviewOwnership(
						req as unknown as Request,
						res as unknown as Response,
						next as unknown as NextFunction,
					),
				InternalError,
			);
		});

		test("Should call next with ValidationError when reviewId is invalid", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: "invalid" } },
				res: {
					locals: {
						user: { id: "507f1f77bcf86cd799439011", isAdmin: false },
					},
				},
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () =>
					verifyReviewOwnership(
						req as unknown as Request,
						res as unknown as Response,
						next as unknown as NextFunction,
					),
				ValidationError,
			);
		});

		test("Should pass reviewId to ReviewService.getById", async (t) => {
			// Arrange
			const reviewId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			const mockGetById = t.mock.method(
				ReviewService.prototype,
				"getById",
				async () => ({
					data: { user: { id: userId, name: "owner" } },
					success: true,
				}),
			);

			// Act
			await verifyReviewOwnership(
				req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction,
			);

			// Assert
			assert.strictEqual(
				mockGetById.mock.calls[0].arguments[0]?.reviewId,
				reviewId,
			);
		});

		test("Should call next once when user owns the review", async (t) => {
			// Arrange
			const reviewId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			t.mock.method(ReviewService.prototype, "getById", async () => ({
				data: { user: { id: userId, name: "owner" } },
				success: true,
			}));

			// Act
			await verifyReviewOwnership(
				req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction,
			);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next once when user is admin despite mismatch", async (t) => {
			// Arrange
			const reviewId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const otherUserId = "507f1f77bcf86cd799439013";
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				res: { locals: { user: { id: userId, isAdmin: true } } },
				testContext: t,
			});

			t.mock.method(ReviewService.prototype, "getById", async () => ({
				data: { user: { id: otherUserId } },
				success: true,
			}));

			// Act
			await verifyReviewOwnership(
				req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction,
			);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next with ForbiddenError when user does not own review and is not admin", async (t) => {
			// Arrange
			const reviewId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const otherUserId = "507f1f77bcf86cd799439013";
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			t.mock.method(ReviewService.prototype, "getById", async () => ({
				data: { user: { id: otherUserId } },
				success: true,
			}));

			// Act & Assert
			await assert.rejects(
				async () =>
					verifyReviewOwnership(
						req as unknown as Request,
						res as unknown as Response,
						next as unknown as NextFunction,
					),
				ForbiddenError,
			);
		});

		test("Should call next with NotFoundError when service reports review not found", async (t) => {
			// Arrange
			const reviewId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				res: { locals: { user: { id: userId, isAdmin: false } } },
				testContext: t,
			});

			t.mock.method(ReviewService.prototype, "getById", async () => ({
				error: new NotFoundError("Review"),
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () =>
					verifyReviewOwnership(
						req as unknown as Request,
						res as unknown as Response,
						next as unknown as NextFunction,
					),
				NotFoundError,
			);
		});
	});
});
