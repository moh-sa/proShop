import assert from "node:assert";
import type { TestContext } from "node:test";
import test, { describe, suite } from "node:test";

import type { NextFunction, Request, Response } from "express";

import {
	AuthenticationError,
	ConflictError,
	ForbiddenError,
	InternalError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import {
	authenticateAccessToken,
	authenticateRefreshSession,
	authorizeAdmin,
	checkProductReviewedByUser,
	checkUserExists,
	verifyReviewOwnership,
} from "../../middlewares/index.js";
import {
	CookieService,
	JwtService,
	ReviewService,
	SessionService,
	UserService,
} from "../../services/index.js";
import type { CookieName, TokenType } from "../../types/index.js";
import { mockExpressCall } from "../mocks/index.js";

suite("Middlewares 〖 Unit Tests 〗", () => {
	describe("authenticateRefreshSession", () => {
		function setupMockGetCookie(t: TestContext, refreshToken?: string) {
			return t.mock.method(
				CookieService.prototype,
				"get",
				({ name }: { name: CookieName }) => {
					return (
						name === "refreshToken" && {
							data: refreshToken ? refreshToken : "refreshTokenString",
							success: true,
						}
					);
				},
			);
		}

		function setupMockVerifyJwt(
			t: TestContext,
			options?: { tokenId?: string; userId?: string },
		) {
			return t.mock.method(
				JwtService.prototype,
				"verify",
				(jwtArgs: { expectedType: TokenType; token: string }) => ({
					data: {
						exp: 2,
						iat: 1,
						tokenId: options?.tokenId ? options.tokenId : "tokenId",
						type: jwtArgs.expectedType,
						userId: options?.userId
							? options.userId
							: "507f1f77bcf86cd799439011",
					},
					success: true,
				}),
			);
		}

		function setupMockValidateSession(
			t: TestContext,
			userId?: string,
			tokenId?: string,
		) {
			const now = new Date();

			return t.mock.method(SessionService.prototype, "validate", async () => ({
				data: {
					createdAt: now,
					expiresAt: new Date(now.getTime() + 10_000),
					id: "1",
					revokedAt: null,
					tokenId: tokenId ? tokenId : "tokenId",
					updatedAt: now,
					userId: userId ? userId : "507f1f77bcf86cd799439011",
				},
				success: true,
			}));
		}

		test("Should call CookieService.get with REFRESH_TOKEN", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			const mockGetCookie = setupMockGetCookie(t);
			setupMockVerifyJwt(t);
			setupMockValidateSession(t);

			// Act
			await authenticateRefreshSession(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(
				mockGetCookie.mock.calls[0].arguments[0].name,
				"refreshToken",
			);
		});

		test("Should pass refresh token from CookieService to JwtService.verify(REFRESH)", async (t) => {
			// Arrange
			const refreshToken = "refresh-token-string";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			setupMockGetCookie(t, refreshToken);
			const mockVerifyJwt = setupMockVerifyJwt(t);
			setupMockValidateSession(t);

			// Act
			await authenticateRefreshSession(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(
				mockVerifyJwt.mock.calls[0].arguments[0].token,
				refreshToken,
			);
		});

		test("Should call SessionService.validate with tokenId and userId from refresh token", async (t) => {
			// Arrange
			const userId = "507f1f77bcf86cd799439011";
			const tokenId = "00000000-0000-0000-0000-000000000000";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			setupMockGetCookie(t);
			setupMockVerifyJwt(t, { tokenId, userId });
			const mockValidateSession = setupMockValidateSession(t, userId, tokenId);

			// Act
			await authenticateRefreshSession(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(
				mockValidateSession.mock.calls[0].arguments[0]?.tokenId,
				tokenId,
			);
			assert.strictEqual(
				mockValidateSession.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should set res.locals.userId on success", async (t) => {
			// Arrange
			const userId = "507f1f77bcf86cd799439011";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			setupMockGetCookie(t);
			setupMockVerifyJwt(t, { userId });
			setupMockValidateSession(t, userId);

			// Act
			await authenticateRefreshSession(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(res.locals.userId, userId);
		});

		test("Should call next once without error on success", async (t) => {
			// Arrange
			const userId = "507f1f77bcf86cd799439011";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			setupMockGetCookie(t);
			setupMockVerifyJwt(t, { userId });
			setupMockValidateSession(t, userId);

			// Act
			await authenticateRefreshSession(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next with AuthenticationError when refresh cookie missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			t.mock.method(CookieService.prototype, "get", () => ({
				error: new ValidationError("missing refresh"),
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => authenticateRefreshSession(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				AuthenticationError,
			);
		});
	});

	describe("authenticateAccessToken", () => {
		function setupMockGetCookie(
			t: TestContext,
			// refreshToken?: string,
			accessToken?: string,
		) {
			return t.mock.method(
				CookieService.prototype,
				"get",
				({ name }: { name: CookieName }) => {
					return (
						name === "accessToken" && {
							data: accessToken ? accessToken : "accessTokenString",
							success: true,
						}
					);
				},
			);
		}

		function setupMockVerifyJwt(
			t: TestContext,
			options?: { tokenId?: string; userId?: string },
		) {
			return t.mock.method(
				JwtService.prototype,
				"verify",
				(argsInput: { expectedType: TokenType; token: string }) => ({
					data: {
						exp: 2,
						iat: 1,
						tokenId: options?.tokenId ? options.tokenId : "tokenId",
						type: argsInput.expectedType,
						userId: options?.userId
							? options.userId
							: "507f1f77bcf86cd799439011",
					},
					success: true,
				}),
			);
		}

		test("Should call CookieService.get with ACCESS_TOKEN", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.userId = "507f1f77bcf86cd799439011";
			const mockGetCookie = setupMockGetCookie(t);
			setupMockVerifyJwt(t);

			// Act
			await authenticateAccessToken(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(
				mockGetCookie.mock.calls[0].arguments[0].name,
				"accessToken",
			);
		});

		test("Should pass access token from CookieService to JwtService.verify(ACCESS)", async (t) => {
			// Arrange
			const accessToken = "accessTokenString";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.userId = "507f1f77bcf86cd799439011";
			setupMockGetCookie(t, accessToken);
			const mockVerifyJwt = setupMockVerifyJwt(t);

			// Act
			await authenticateAccessToken(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(
				mockVerifyJwt.mock.calls[0].arguments[0].token,
				accessToken,
			);
		});

		test("Should call next once without error on success", async (t) => {
			// Arrange
			const userId = "507f1f77bcf86cd799439011";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.userId = userId;
			setupMockGetCookie(t);
			setupMockVerifyJwt(t, { userId });

			// Act
			await authenticateAccessToken(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next with InternalError when res.locals.userId is missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () => authenticateAccessToken(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				InternalError,
			);
		});

		test("Should call next with AuthenticationError when access cookie missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.userId = "507f1f77bcf86cd799439011";
			t.mock.method(CookieService.prototype, "get", () => ({
				error: new ValidationError("missing access"),
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => authenticateAccessToken(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				AuthenticationError,
			);
		});

		test("Should call next with AuthenticationError when access token is invalid", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.userId = "507f1f77bcf86cd799439011";
			setupMockGetCookie(t);
			t.mock.method(JwtService.prototype, "verify", () => ({
				error: new ValidationError("invalid access"),
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => authenticateAccessToken(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				AuthenticationError,
			);
		});

		test("Should call next with ValidationError when token pair userIds mismatch", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.userId = "507f1f77bcf86cd799439011";
			setupMockGetCookie(t);
			setupMockVerifyJwt(t, { userId: "another-user-id" });

			// Act & Assert
			await assert.rejects(
				async () => authenticateAccessToken(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				ValidationError,
			);
		});
	});

	describe("checkUserIdExists", () => {
		test("Should call next with InternalError when res.locals.userId is missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () => checkUserExists(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				InternalError,
			);
		});

		test("Should call UserService.getById with res.locals.userId", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			const userId = "507f1f77bcf86cd799439011";
			res.locals.userId = userId;

			const mockGetUserById = t.mock.method(
				UserService.prototype,
				"getById",
				async () => ({
					data: { id: userId, email: "a@b.com", isAdmin: false, name: "A" },
					success: true,
				}),
			);

			// Act
			await checkUserExists(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(
				mockGetUserById.mock.calls[0].arguments[0]?.userId,
				userId,
			);
		});

		test("Should call next with ValidationError when service returns validation error", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			res.locals.userId = "invalid-id";

			t.mock.method(UserService.prototype, "getById", async () => ({
				error: new ValidationError("Invalid userId"),
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => checkUserExists(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				ValidationError,
			);
		});

		test("Should set res.locals.user when user exists", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			const userId = "507f1f77bcf86cd799439011";
			const user = {
				id: userId,
				email: "a@b.com",
				isAdmin: false,
				name: "A",
			};
			res.locals.userId = userId;

			t.mock.method(UserService.prototype, "getById", async () => ({
				data: user,
				success: true,
			}));

			// Act
			await checkUserExists(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.deepStrictEqual(res.locals.user, user);
		});

		test("Should call next once without error on success", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			const userId = "507f1f77bcf86cd799439011";
			res.locals.userId = userId;

			t.mock.method(UserService.prototype, "getById", async () => ({
				data: { id: userId, email: "a@b.com", isAdmin: false, name: "A" },
				success: true,
			}));

			// Act
			await checkUserExists(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});
	});

	describe("checkIfUserIsAdmin", () => {
		test("Should call next once when user is admin", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.user = { id: "507f1f77bcf86cd799439011", isAdmin: true };

			// Act
			await authorizeAdmin(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

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
				async () => authorizeAdmin(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
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
				async () => authorizeAdmin(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				ForbiddenError,
			);
		});
	});

	describe("checkProductReviewedByUser", () => {
		test("Should call next with InternalError when res.locals.user is missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: {} },
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				InternalError,
			);
		});

		test("Should call next with ValidationError when productId is invalid", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: "invalid" } },
				res: { locals: { user: { id: "507f1f77bcf86cd799439011" } } },
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				ValidationError,
			);
		});

		test("Should pass productId to ReviewService.existsByUserIdAndProductId", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			const mockExists = t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ error: new NotFoundError("Review"), success: false }),
			);

			// Act
			await checkProductReviewedByUser(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(
				mockExists.mock.calls[0].arguments[0]?.productId,
				productId,
			);
		});

		test("Should pass userId to ReviewService.existsByUserIdAndProductId", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			const mockExists = t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ error: new NotFoundError("Review"), success: false }),
			);

			// Act
			await checkProductReviewedByUser(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(mockExists.mock.calls[0].arguments[0]?.userId, userId);
		});

		test("Should not throw when review does not exist", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ error: new NotFoundError("Review"), success: false }),
			);

			// Act & Assert
			await assert.doesNotReject(async () =>
				checkProductReviewedByUser(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
			);
		});

		test("Should call next once without error when review does not exist", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ error: new NotFoundError("Review"), success: false }),
			);

			// Act
			await checkProductReviewedByUser(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next with ConflictError when review exists", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { id: userId } } },
				testContext: t,
			});

			t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ data: { id: productId }, success: true }),
			);

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				ConflictError,
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
				async () => verifyReviewOwnership(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
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
				async () => verifyReviewOwnership(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
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
			await verifyReviewOwnership(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

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
			await verifyReviewOwnership(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

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
			await verifyReviewOwnership(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction);

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
				async () => verifyReviewOwnership(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
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
				async () => verifyReviewOwnership(req as unknown as Request,
				res as unknown as Response,
				next as unknown as NextFunction),
				NotFoundError,
			);
		});
	});
});
