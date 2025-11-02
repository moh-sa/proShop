import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { CookieName } from "../../constants/cookie.constants.js";
import {
	AuthenticationError,
	AuthorizationError,
	ValidationError,
} from "../../errors/index.js";
import {
	authenticate,
	checkIfUserIsAdmin,
	checkUserIdExists,
	verifyReviewOwnership,
} from "../../middlewares/index.js";
import Review from "../../models/review.model.js";
import { Session } from "../../models/session.model.js";
import User from "../../models/user.model.js";
import { JwtService } from "../../services/index.js";
import {
	generateMockInsertUser,
	generateMockObjectId,
	generateMockSelectReview,
	generateMockSelectUser,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContext,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("Middlewares 〖 Integration Tests 〗", () => {
	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => {
		await User.deleteMany({});
		await Session.deleteMany({});
	});

	describe("checkUserIdExists", () => {
		test("Should find user by id and set res.locals.user", async () => {
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockInsertUser();

			const user = await User.create(mockUser);
			res.locals.token = { _id: user._id, exp: 456, iat: 123 };

			await checkUserIdExists(req, res, next);

			assert.ok(res.locals.user);
			assert.equal(res.locals.user._id.toString(), user._id.toString());
		});

		test("Should throw 'AuthenticationError' if user does not exist", async () => {
			const { next, req, res } = createMockExpressContext();
			const mockId = generateMockObjectId();

			res.locals.token = { _id: mockId, exp: 456, iat: 123 };

			try {
				await checkUserIdExists(req, res, next);
			} catch (error) {
				assert.ok(error instanceof AuthenticationError);
				assert.equal(error.statusCode, 401);
				assert.equal(error.message, "Authentication required");
			}
		});
	});

	describe("checkIfUserIsAdmin", () => {
		test("Should allow admin access", async () => {
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: true });

			res.locals.user = mockUser;

			await checkIfUserIsAdmin(req, res, next);
		});

		test("Should throw 'AuthorizationError' if user is not admin", async () => {
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: false });

			res.locals.user = mockUser;

			try {
				await checkIfUserIsAdmin(req, res, next);
			} catch (error) {
				assert.ok(error instanceof AuthorizationError);
				assert.equal(error.statusCode, 403);
				assert.equal(error.message, "Admin access required.");
			}
		});
	});

	describe("verifyReviewOwnership", () => {
		test("Should allow access if 'review.user' matches 'req.params.userId'", async () => {
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			res.locals.user = mockUser;

			const mockReview = generateMockSelectReview();
			const created = await Review.create({
				...mockReview,
				user: mockUser._id,
			});
			req.params.reviewId = created._id.toString();

			await verifyReviewOwnership(req, res, next);

			assert.equal(res.locals.review._id.toString(), mockReview._id.toString());
			assert.equal(res.locals.review.comment, mockReview.comment);
		});

		test("Should throw 'AuthorizationError' if user is not the owner", async () => {
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: false });
			res.locals.user = mockUser;

			const mockReview = generateMockSelectReview();
			await Review.create(mockReview);
			req.params.reviewId = mockReview._id.toString();

			try {
				await verifyReviewOwnership(req, res, next);
				assert.fail("Should throw 'AuthorizationError'");
			} catch (error) {
				assert.ok(error instanceof AuthorizationError);
			}
		});
	});

	describe("authenticate", () => {
		test("Should throw AuthenticationError when refresh token cookie is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {};

			// Act & Assert
			await assert.rejects(
				async () => authenticate(req, res, next),
				AuthenticationError,
			);
		});

		test("Should throw AuthenticationError when refresh token is invalid", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				[CookieName.REFRESH_TOKEN]: JSON.stringify("invalid"),
			};

			// Act & Assert
			await assert.rejects(
				async () => authenticate(req, res, next),
				AuthenticationError,
			);
		});

		test("Should throw AuthenticationError when session does not exist", async () => {
			// Arrange
			const jwtService = new JwtService();
			const userId = generateMockObjectId().toString();
			const refresh = jwtService.generateRefreshToken({ userId });
			assert.ok(refresh.success);

			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				[CookieName.REFRESH_TOKEN]: JSON.stringify(refresh.data.token),
			};

			// Act & Assert
			await assert.rejects(
				async () => authenticate(req, res, next),
				AuthenticationError,
			);
		});

		test("Should throw AuthenticationError when access token cookie is missing", async () => {
			// Arrange
			const jwtService = new JwtService();
			const userId = generateMockObjectId().toString();
			const refresh = jwtService.generateRefreshToken({ userId });
			assert.ok(refresh.success);
			await Session.create({
				expiresAt: new Date(Date.now() + 60_000),
				tokenId: refresh.data.tokenId,
				userId,
			});

			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				[CookieName.REFRESH_TOKEN]: JSON.stringify(refresh.data.token),
			};

			// Act & Assert
			await assert.rejects(
				async () => authenticate(req, res, next),
				AuthenticationError,
			);
		});

		test("Should throw AuthenticationError when access token is invalid", async () => {
			// Arrange
			const jwtService = new JwtService();
			const userId = generateMockObjectId().toString();
			const refresh = jwtService.generateRefreshToken({ userId });
			assert.ok(refresh.success);
			await Session.create({
				expiresAt: new Date(Date.now() + 60_000),
				tokenId: refresh.data.tokenId,
				userId,
			});

			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				[CookieName.ACCESS_TOKEN]: JSON.stringify("invalid"),
				[CookieName.REFRESH_TOKEN]: JSON.stringify(refresh.data.token),
			};

			// Act & Assert
			await assert.rejects(
				async () => authenticate(req, res, next),
				AuthenticationError,
			);
		});

		test("Should throw ValidationError when token pair userIds mismatch", async () => {
			// Arrange
			const jwtService = new JwtService();
			const userId = generateMockObjectId().toString();
			const otherUserId = generateMockObjectId().toString();
			const refresh = jwtService.generateRefreshToken({ userId });
			assert.ok(refresh.success);
			await Session.create({
				expiresAt: new Date(Date.now() + 60_000),
				tokenId: refresh.data.tokenId,
				userId,
			});
			const access = jwtService.generateAccessToken({ userId: otherUserId });
			assert.ok(access.success);

			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				[CookieName.ACCESS_TOKEN]: JSON.stringify(access.data.token),
				[CookieName.REFRESH_TOKEN]: JSON.stringify(refresh.data.token),
			};

			// Act & Assert
			await assert.rejects(
				async () => authenticate(req, res, next),
				ValidationError,
			);
		});

		test("Should set res.locals.userId when tokens and session are valid", async () => {
			// Arrange
			const jwtService = new JwtService();
			const userId = generateMockObjectId().toString();
			const tokenPair = jwtService.generateTokenPair({ userId });
			assert.ok(tokenPair.success);
			await Session.create({
				expiresAt: new Date(Date.now() + 60_000),
				tokenId: tokenPair.data.refresh.tokenId,
				userId,
			});

			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				[CookieName.ACCESS_TOKEN]: JSON.stringify(tokenPair.data.access.token),
				[CookieName.REFRESH_TOKEN]: JSON.stringify(
					tokenPair.data.refresh.token,
				),
			};

			// Act
			await authenticate(req, res, next);

			// Assert
			assert.strictEqual(res.locals.userId, userId);
		});
	});
});
