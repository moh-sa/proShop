import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

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
import Product from "../../models/product.model.js";
import Review from "../../models/review.model.js";
import { Session } from "../../models/session.model.js";
import User from "../../models/user.model.js";
import { JwtService } from "../../services/index.js";
import {
	generateMockInsertProductWithStringImage,
	generateMockInsertReview,
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
		await Review.deleteMany({});
	});

	describe("checkProductReviewedByUser", () => {
		test("Should throw ConflictError when review exists for user and product", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const user = await User.create(generateMockInsertUser());
			const product = await Product.create({
				...generateMockInsertProductWithStringImage(),
				user: user._id,
			});
			await Review.create({
				...generateMockInsertReview(),
				product: product._id,
				user: user._id,
			});

			res.locals.user = user;
			req.params.productId = product._id.toString();

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req, res, next),
				ConflictError,
			);
		});

		test("Should not throw when review does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const user = await User.create(generateMockInsertUser());
			const productData = generateMockInsertProductWithStringImage();
			const product = await Product.create({ ...productData, user: user._id });

			res.locals.user = user;
			req.params.productId = product._id.toString();

			// Act & Assert
			await assert.doesNotReject(async () =>
				checkProductReviewedByUser(req, res, next),
			);
		});

		test("Should throw ValidationError when productId is invalid", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const user = await User.create(generateMockInsertUser());

			res.locals.user = user;
			req.params.productId = "invalid";

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req, res, next),
				ValidationError,
			);
		});

		test("Should throw InternalError when res.locals.user is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.params.productId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req, res, next),
				InternalError,
			);
		});
	});

	describe("checkUserIdExists", () => {
		test("Should set res.locals.user when user exists for res.locals.userId", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockInsertUser();
			const user = await User.create(mockUser);

			res.locals.userId = user._id.toString();

			// Act
			await checkUserExists(req, res, next);

			// Assert
			assert.ok(res.locals.user);
		});

		test("Should set the correct user in res.locals.user", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockInsertUser();
			const user = await User.create(mockUser);

			res.locals.userId = user._id.toString();

			// Act
			await checkUserExists(req, res, next);

			// Assert
			assert.equal(res.locals.user?._id.toString(), user._id.toString());
		});

		test("Should throw NotFoundError when user does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockId = generateMockObjectId();

			res.locals.userId = mockId.toString();

			// Act & Assert
			await assert.rejects(
				async () => checkUserExists(req, res, next),
				NotFoundError,
			);
		});

		test("Should throw InternalError when res.locals.userId is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			// Act & Assert
			await assert.rejects(
				async () => checkUserExists(req, res, next),
				InternalError,
			);
		});
	});

	describe("checkIfUserIsAdmin", () => {
		test("Should not throw when user is admin", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: true });

			res.locals.user = mockUser;

			// Act & Assert
			await assert.doesNotReject(async () => authorizeAdmin(req, res, next));
		});

		test("Should throw 'ForbiddenError' if user is not admin", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: false });
			res.locals.user = mockUser;

			// Act & Assert
			await assert.rejects(
				async () => authorizeAdmin(req, res, next),
				ForbiddenError,
			);
		});

		test("Should throw 'InternalError' if user is missing in res.locals", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			// Act & Assert
			await assert.rejects(
				async () => authorizeAdmin(req, res, next),
				InternalError,
			);
		});
	});

	describe("verifyReviewOwnership", () => {
		test("Should not throw when user owns the review", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: false });
			res.locals.user = mockUser;

			const mockReview = generateMockSelectReview();
			const created = await Review.create({
				...mockReview,
				user: mockUser._id,
			});
			req.params.reviewId = created._id.toString();

			// Act & Assert
			await assert.doesNotReject(async () =>
				verifyReviewOwnership(req, res, next),
			);
		});

		test("Should not throw when user is admin and not owner", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: true });
			res.locals.user = mockUser;

			const mockReview = generateMockSelectReview();
			const created = await Review.create({ ...mockReview });
			req.params.reviewId = created._id.toString();

			// Act & Assert
			await assert.doesNotReject(async () =>
				verifyReviewOwnership(req, res, next),
			);
		});

		test("Should throw ForbiddenError when user is not owner and not admin", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: false });
			res.locals.user = mockUser;

			const mockReview = generateMockSelectReview();
			const created = await Review.create({ ...mockReview });
			req.params.reviewId = created._id.toString();

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req, res, next),
				ForbiddenError,
			);
		});

		test("Should throw ValidationError when reviewId is invalid", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: false });
			res.locals.user = mockUser;
			req.params.reviewId = "invalid";

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req, res, next),
				ValidationError,
			);
		});

		test("Should throw InternalError when res.locals.user is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.params.reviewId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req, res, next),
				InternalError,
			);
		});

		test("Should throw NotFoundError when review does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: false });
			res.locals.user = mockUser;
			req.params.reviewId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req, res, next),
				NotFoundError,
			);
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
