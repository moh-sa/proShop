import type { TestContext } from "node:test";

import assert from "node:assert";
import test, { describe, suite } from "node:test";

import type { TokenType } from "../../types/index.js";

import { CookieName } from "../../constants/cookie.constants.js";
import {
	AuthenticationError,
	ConflictError,
	ForbiddenError,
	InternalError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import {
	authenticate,
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
import { mockExpressCall } from "../mocks/index.js";

suite("Middlewares 〖 Unit Tests 〗", () => {
	describe("authenticate", () => {
		function setupMockGetCookie(
			t: TestContext,
			refreshToken?: string,
			accessToken?: string,
		) {
			return t.mock.method(
				CookieService.prototype,
				"get",
				({ name }: { name: CookieName }) => {
					return name === CookieName.REFRESH_TOKEN
						? {
								data: refreshToken ? refreshToken : "refreshTokenString",
								success: true,
							}
						: {
								data: accessToken ? accessToken : "accessTokenString",
								success: true,
							};
				},
			);
		}

		function setupMockVerifyJwt(t: TestContext, tokenId?: string) {
			return t.mock.method(
				JwtService.prototype,
				"verify",
				(args: { expectedType: TokenType; token: string }) => ({
					data: {
						exp: 2,
						iat: 1,
						tokenId: tokenId ? tokenId : "tokenId",
						type: args.expectedType,
						userId: "507f1f77bcf86cd799439011",
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
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockGetCookie.mock.calls[0].arguments[0].name,
				CookieName.REFRESH_TOKEN,
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
			await authenticate(req as any, res as any, next);

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
			setupMockVerifyJwt(t, tokenId);
			const mockValidateSession = setupMockValidateSession(t, userId, tokenId);

			// Act
			await authenticate(req as any, res as any, next);

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

		test("Should call CookieService.get with ACCESS_TOKEN", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			const mockGetCookie = setupMockGetCookie(t);
			setupMockVerifyJwt(t);
			setupMockValidateSession(t);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockGetCookie.mock.calls[1].arguments[0].name,
				CookieName.ACCESS_TOKEN,
			);
		});

		test("Should pass access token from CookieService to JwtService.verify(ACCESS)", async (t) => {
			// Arrange
			const accessToken = "accessTokenString";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			setupMockGetCookie(t);
			const mockVerifyJwt = setupMockVerifyJwt(t);
			setupMockValidateSession(t);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockVerifyJwt.mock.calls[1].arguments[0].token,
				accessToken,
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
			setupMockVerifyJwt(t);
			setupMockValidateSession(t, userId);

			// Act
			await authenticate(req as any, res as any, next);

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
			setupMockVerifyJwt(t);
			setupMockValidateSession(t, userId);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next with AuthenticationError when refresh cookie missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			setupMockGetCookie(t);

			// Act & Assert
			await assert.rejects(
				async () => authenticate(req as any, res as any, next),
				AuthenticationError,
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
				async () => checkUserExists(req as any, res as any, next),
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
					data: { _id: userId, email: "a@b.com", isAdmin: false, name: "A" },
					success: true,
				}),
			);

			// Act
			await checkUserExists(req as any, res as any, next);

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
				async () => checkUserExists(req as any, res as any, next),
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
				_id: userId,
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
			await checkUserExists(req as any, res as any, next);

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
				data: { _id: userId, email: "a@b.com", isAdmin: false, name: "A" },
				success: true,
			}));

			// Act
			await checkUserExists(req as any, res as any, next);

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
			res.locals.user = { _id: "507f1f77bcf86cd799439011", isAdmin: true };

			// Act
			await authorizeAdmin(req as any, res as any, next);

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
				async () => authorizeAdmin(req as any, res as any, next),
				InternalError,
			);
		});

		test("Should call next with ForbiddenError when user is not admin", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			res.locals.user = { _id: "507f1f77bcf86cd799439011", isAdmin: false };

			// Act & Assert
			await assert.rejects(
				async () => authorizeAdmin(req as any, res as any, next),
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
				async () => checkProductReviewedByUser(req as any, res as any, next),
				InternalError,
			);
		});

		test("Should call next with ValidationError when productId is invalid", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: "invalid" } },
				res: { locals: { user: { _id: "507f1f77bcf86cd799439011" } } },
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req as any, res as any, next),
				ValidationError,
			);
		});

		test("Should pass productId to ReviewService.existsByUserIdAndProductId", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			const mockExists = t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ error: new NotFoundError("Review"), success: false }),
			);

			// Act
			await checkProductReviewedByUser(req as any, res as any, next);

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
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			const mockExists = t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ error: new NotFoundError("Review"), success: false }),
			);

			// Act
			await checkProductReviewedByUser(req as any, res as any, next);

			// Assert
			assert.strictEqual(mockExists.mock.calls[0].arguments[0]?.userId, userId);
		});

		test("Should not throw when review does not exist", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ error: new NotFoundError("Review"), success: false }),
			);

			// Act & Assert
			await assert.doesNotReject(async () =>
				checkProductReviewedByUser(req as any, res as any, next),
			);
		});

		test("Should call next once without error when review does not exist", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ error: new NotFoundError("Review"), success: false }),
			);

			// Act
			await checkProductReviewedByUser(req as any, res as any, next);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next with ConflictError when review exists", async (t) => {
			// Arrange
			const productId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				res: { locals: { user: { _id: userId } } },
				testContext: t,
			});

			t.mock.method(
				ReviewService.prototype,
				"existsByUserIdAndProductId",
				async () => ({ data: { _id: productId }, success: true }),
			);

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req as any, res as any, next),
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
				async () => verifyReviewOwnership(req as any, res as any, next),
				InternalError,
			);
		});

		test("Should call next with ValidationError when reviewId is invalid", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: "invalid" } },
				res: {
					locals: {
						user: { _id: "507f1f77bcf86cd799439011", isAdmin: false },
					},
				},
				testContext: t,
			});

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req as any, res as any, next),
				ValidationError,
			);
		});

		test("Should pass reviewId to ReviewService.getById", async (t) => {
			// Arrange
			const reviewId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				res: { locals: { user: { _id: userId, isAdmin: false } } },
				testContext: t,
			});

			const mockGetById = t.mock.method(
				ReviewService.prototype,
				"getById",
				async () => ({
					data: { user: { _id: userId } },
					success: true,
				}),
			);

			// Act
			await verifyReviewOwnership(req as any, res as any, next);

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
				res: { locals: { user: { _id: userId, isAdmin: false } } },
				testContext: t,
			});

			t.mock.method(ReviewService.prototype, "getById", async () => ({
				data: { user: { _id: userId } },
				success: true,
			}));

			// Act
			await verifyReviewOwnership(req as any, res as any, next);

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
				res: { locals: { user: { _id: userId, isAdmin: true } } },
				testContext: t,
			});

			t.mock.method(ReviewService.prototype, "getById", async () => ({
				data: { user: { _id: otherUserId } },
				success: true,
			}));

			// Act
			await verifyReviewOwnership(req as any, res as any, next);

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
				res: { locals: { user: { _id: userId, isAdmin: false } } },
				testContext: t,
			});

			t.mock.method(ReviewService.prototype, "getById", async () => ({
				data: { user: { _id: otherUserId } },
				success: true,
			}));

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req as any, res as any, next),
				ForbiddenError,
			);
		});

		test("Should call next with NotFoundError when service reports review not found", async (t) => {
			// Arrange
			const reviewId = "507f1f77bcf86cd799439011";
			const userId = "507f1f77bcf86cd799439012";
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				res: { locals: { user: { _id: userId, isAdmin: false } } },
				testContext: t,
			});

			t.mock.method(ReviewService.prototype, "getById", async () => ({
				error: new NotFoundError("Review"),
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req as any, res as any, next),
				NotFoundError,
			);
		});
	});
});
