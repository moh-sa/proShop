import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

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
import { ProductModel } from "../../models/product.model.js";
import { ReviewModel } from "../../models/review.model.js";
import { SessionModel } from "../../models/session.model.js";
import { UserModel } from "../../models/user.model.js";
import {
	generateMockInsertReview,
	generateMockObjectId,
	generateMockSelectUser,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContextFromHandler,
	createReview,
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

	describe("checkIfUserIsAdmin", () => {
		test("Should not throw when user is admin", async () => {
			// Arrange
			const { next, req, res } =
				createMockExpressContextFromHandler(authorizeAdmin);

			const mockUser = generateMockSelectUser({ isAdmin: true });

			res.locals.user = mockUser;

			// Act & Assert
			await assert.doesNotReject(async () => authorizeAdmin(req, res, next));
		});

		test("Should throw 'ForbiddenError' if user is not admin", async () => {
			// Arrange
			const { next, req, res } =
				createMockExpressContextFromHandler(authorizeAdmin);

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
			const { next, req, res } =
				createMockExpressContextFromHandler(authorizeAdmin);

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
			const { next, req, res } = createMockExpressContextFromHandler(
				verifyReviewOwnership,
			);

			const mockUser = generateMockSelectUser({ isAdmin: false });
			res.locals.user = mockUser;

			const created = await createReview(
				generateMockInsertReview({
					user: { id: mockUser.id, name: mockUser.name },
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
			const { next, req, res } = createMockExpressContextFromHandler(
				verifyReviewOwnership,
			);

			const mockUser = generateMockSelectUser({ isAdmin: true });
			res.locals.user = mockUser;

			const created = await createReview(
				generateMockInsertReview({
					user: { id: mockUser.id, name: mockUser.name },
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
			const { next, req, res } = createMockExpressContextFromHandler(
				verifyReviewOwnership,
			);

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
			const { next, req, res } = createMockExpressContextFromHandler(
				verifyReviewOwnership,
			);

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
			const { next, req, res } = createMockExpressContextFromHandler(
				verifyReviewOwnership,
			);

			req.params.reviewId = generateMockObjectId();

			// Act & Assert
			await assert.rejects(
				async () => verifyReviewOwnership(req, res, next),
				InternalError,
			);
		});

		test("Should throw NotFoundError when review does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				verifyReviewOwnership,
			);

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
});
