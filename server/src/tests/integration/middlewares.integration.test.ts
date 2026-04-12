import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

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
import { ProductModel } from "../../models/product.model.js";
import { ReviewModel } from "../../models/review.model.js";
import { SessionModel } from "../../models/session.model.js";
import { UserModel } from "../../models/user.model.js";
import { JwtService } from "../../services/index.js";
import {
	generateMockInsertProductWithStringImage,
	generateMockInsertReview,
	generateMockInsertSession,
	generateMockInsertUser,
	generateMockObjectId,
	generateMockSelectUser,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContext,
	createProduct,
	createReview,
	createSession,
	createUser,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("Middlewares 〖 Integration Tests 〗", () => {
	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => {
		await UserModel.deleteMany({});
		await SessionModel.deleteMany({});
		await ReviewModel.deleteMany({});
		await ProductModel.deleteMany({});
	});

	describe("checkProductReviewedByUser", () => {
		test("Should throw ConflictError when review exists for user and product", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const user = await createUser(generateMockInsertUser());

			const product = await createProduct({
				...generateMockInsertProductWithStringImage(),
				user: user.id,
			});

			await createReview(
				generateMockInsertReview({
					product: product.id,
					user: user.id,
				}),
			);

			res.locals.user = user;
			req.params.productId = product.id;

			// Act & Assert
			await assert.rejects(
				async () => checkProductReviewedByUser(req, res, next),
				ConflictError,
			);
		});

		test("Should not throw when review does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const user = await createUser(generateMockInsertUser());

			const product = await createProduct({
				...generateMockInsertProductWithStringImage(),
				user: user.id,
			});

			res.locals.user = user;
			req.params.productId = product.id;

			// Act & Assert
			await assert.doesNotReject(async () =>
				checkProductReviewedByUser(req, res, next),
			);
		});

		test("Should throw ValidationError when productId is invalid", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			const user = await createUser(generateMockInsertUser());

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
			req.params.productId = generateMockObjectId();

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

			const user = await createUser(generateMockInsertUser());

			res.locals.userId = user.id;

			// Act
			await checkUserExists(req, res, next);

			// Assert
			assert.ok(res.locals.user);
		});

		test("Should set the correct user in res.locals.user", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			const user = await createUser(generateMockInsertUser());

			const userId = user.id;

			res.locals.userId = userId;

			// Act
			await checkUserExists(req, res, next);

			// Assert
			assert.equal(res.locals.user?.id, userId);
		});

		test("Should throw NotFoundError when user does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			const mockId = generateMockObjectId();
			res.locals.userId = mockId;

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

			const created = await createReview(
				generateMockInsertReview({
					user: mockUser.id,
				}),
			);

			req.params.reviewId = created.id;

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

			const created = await createReview(
				generateMockInsertReview({
					user: mockUser.id,
				}),
			);

			req.params.reviewId = created.id;

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

			const created = await createReview(generateMockInsertReview());

			req.params.reviewId = created.id;

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

			req.params.reviewId = generateMockObjectId();

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
			req.params.reviewId = generateMockObjectId();

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req, res, next),
				NotFoundError,
			);
		});
	});

	describe("authenticateRefreshSession", () => {
		const jwtService = new JwtService();

		test("Should throw AuthenticationError when refresh token cookie is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {};

			// Act & Assert
			await assert.rejects(
				async () => authenticateRefreshSession(req, res, next),
				AuthenticationError,
			);
		});

		test("Should throw AuthenticationError when refresh token is invalid", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				refreshToken: JSON.stringify("invalid"),
			};

			// Act & Assert
			await assert.rejects(
				async () => authenticateRefreshSession(req, res, next),
				AuthenticationError,
			);
		});

		test("Should throw AuthenticationError when session does not exist", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const refresh = jwtService.generateRefreshToken({ userId });
			assert.ok(refresh.success);

			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				refreshToken: JSON.stringify(refresh.data.token),
			};

			// Act & Assert
			await assert.rejects(
				async () => authenticateRefreshSession(req, res, next),
				AuthenticationError,
			);
		});

		test("Should set res.locals.userId when refresh token and session are valid", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const refresh = jwtService.generateRefreshToken({ userId });
			assert.ok(refresh.success);

			await createSession(
				generateMockInsertSession({
					tokenId: refresh.data.tokenId,
					userId,
				}),
			);

			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {
				refreshToken: JSON.stringify(refresh.data.token),
			};

			// Act
			await authenticateRefreshSession(req, res, next);

			// Assert
			assert.strictEqual(res.locals.userId, userId);
		});
	});

	describe("authenticateAccessToken", () => {
		const jwtService = new JwtService();

		test("Should throw InternalError when res.locals.userId is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.cookies = {};
			req.signedCookies = {};

			// Act & Assert
			await assert.rejects(
				async () => authenticateAccessToken(req, res, next),
				InternalError,
			);
		});

		test("Should throw AuthenticationError when access token cookie is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			res.locals.userId = generateMockObjectId();
			req.cookies = {};
			req.signedCookies = {};

			// Act & Assert
			await assert.rejects(
				async () => authenticateAccessToken(req, res, next),
				AuthenticationError,
			);
		});

		test("Should throw ValidationError when token pair userIds mismatch", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const access = jwtService.generateAccessToken({ userId });
			assert.ok(access.success);

			const { next, req, res } = createMockExpressContext();
			res.locals.userId = generateMockObjectId();
			req.cookies = {};
			req.signedCookies = {
				accessToken: JSON.stringify(access.data.token),
			};

			// Act & Assert
			await assert.rejects(
				async () => authenticateAccessToken(req, res, next),
				ValidationError,
			);
		});

		test("Should not throw when access token matches res.locals.userId", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const access = jwtService.generateAccessToken({ userId });
			assert.ok(access.success);

			const { next, req, res } = createMockExpressContext();
			res.locals.userId = userId;
			req.cookies = {};
			req.signedCookies = {
				accessToken: JSON.stringify(access.data.token),
			};

			// Act & Assert
			await assert.doesNotReject(async () =>
				authenticateAccessToken(req, res, next),
			);
		});
	});
});
