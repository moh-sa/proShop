import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { ReviewController } from "../../controllers/index.js";
import { NotFoundError } from "../../errors/index.js";
import { ReviewModel } from "../../models/review.model.js";
import type { Review } from "../../types/index.js";
import {
	generateMockInsertReview,
	generateMockInsertReviews,
	generateMockObjectId,
	generateMockSelectUser,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContextFromHandler,
	createReview,
	createReviews,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("Review Controller 〖 Integration Tests 〗", () => {
	const controller = new ReviewController();

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => await ReviewModel.deleteMany({}));

	describe("create", () => {
		test("Should return success response when 'service.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const mockReview = generateMockInsertReview({
				user: { id: mockUser.id, name: mockUser.name },
			});

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockReview;
			res.locals.user = mockUser;

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
		});

		test("Should return '201' status code when 'service.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const mockReview = generateMockInsertReview({
				user: { id: mockUser.id, name: mockUser.name },
			});

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockReview;
			res.locals.user = mockUser;

			// Act
			await controller.create(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 201);
		});

		test("Should create review when 'service.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const mockReview = generateMockInsertReview({
				user: { id: mockUser.id, name: mockUser.name },
			});

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockReview;
			res.locals.user = mockUser;

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
			assert.ok(response.data.id);
			assert.strictEqual(response.data.productId, mockReview.productId);
			assert.strictEqual(response.data.user.id, mockReview.user.id);
			assert.strictEqual(response.data.user.name, mockReview.user.name);
			assert.strictEqual(response.data.rating, mockReview.rating);
			assert.strictEqual(response.data.comment, mockReview.comment);
		});
	});

	describe("getById", () => {
		test("Should return success response when 'service.getById' is called with valid 'reviewId'", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.getById' is called with valid 'reviewId'", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return review object when 'service.getById' is called with existing 'reviewId'", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
			assert.strictEqual(response.data.productId, createdReview.productId);
			assert.strictEqual(response.data.user.id, createdReview.user.id);
			assert.strictEqual(response.data.user.name, createdReview.user.name);
			assert.strictEqual(response.data.rating, createdReview.rating);
			assert.strictEqual(response.data.comment, createdReview.comment);
		});

		test("Should throw 'NotFoundError' when 'service.getById' is called with non-existent 'reviewId'", async () => {
			// Arrange
			const reviewId = generateMockObjectId();
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			req.params = { reviewId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.getById(req, res, next),
				(error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					return true;
				},
			);
		});
	});

	describe("getAll", () => {
		test("Should return success response when 'service.getAll' is called", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
		});

		test("Should return '200' status code when 'service.getAll' is called", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return paginated reviews when 'service.getAll' is called with reviews in database", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, createdReviews.length);

			assert.strictEqual(response.meta.totalItems, createdReviews.length);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.totalPages, 1);
			assert.strictEqual(response.meta.pageSize, 10);
			assert.strictEqual(response.meta.hasNextPage, false);
			assert.strictEqual(response.meta.hasPreviousPage, false);
		});

		test("Should return empty paginated result when 'service.getAll' is called with no reviews in database", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, 0);

			assert.strictEqual(response.meta.totalItems, 0);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.totalPages, 1);
		});

		test("Should return paginated reviews with correct pagination when 'service.getAll' is called with pageSize", async () => {
			// Arrange
			await createReviews(generateMockInsertReviews({ count: 15 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { pageNumber: "1", pageSize: "5" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, 5);

			assert.strictEqual(response.meta.totalItems, 15);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.pageSize, 5);
			assert.strictEqual(response.meta.totalPages, 3);
			assert.strictEqual(response.meta.hasNextPage, true);
			assert.strictEqual(response.meta.hasPreviousPage, false);
		});

		test("Should return paginated reviews for second page when 'service.getAll' is called with pageNumber 2", async () => {
			// Arrange
			await createReviews(generateMockInsertReviews({ count: 15 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { pageNumber: "2", pageSize: "5" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, 5);

			assert.strictEqual(response.meta.totalItems, 15);
			assert.strictEqual(response.meta.currentPage, 2);
			assert.strictEqual(response.meta.pageSize, 5);
			assert.strictEqual(response.meta.totalPages, 3);
			assert.strictEqual(response.meta.hasNextPage, true);
			assert.strictEqual(response.meta.hasPreviousPage, true);
		});

		test("Should return only reviews for productId when 'service.getAll' is called with productId query", async () => {
			// Arrange
			const productId = generateMockObjectId();

			await createReviews([
				...generateMockInsertReviews({
					count: 2,
					options: { productId },
				}),
				...generateMockInsertReviews({
					count: 3,
				}),
			]);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { productId: productId, pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.meta.totalItems, 2);
			assert.strictEqual(response.data.length, 2);
			assert.strictEqual(
				response.data.every((review: Review) => review.productId === productId),
				true,
			);
		});
	});

	describe("getAllByUserId", () => {
		test("Should return success response when 'service.getAllByUserId' is called with valid 'userId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: createdReviews[0].user.id };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length > 0, true);
		});

		test("Should return '200' status code when 'service.getAllByUserId' is called with valid 'userId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: createdReviews[0].user.id };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return paginated reviews for specific user when 'service.getAllByUserId' is called", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { user: { id: userId, name: "test-user" } },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 2 }),
			]);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: userId };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, targetReviews.length);

			assert.strictEqual(response.meta.totalItems, targetReviews.length);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.totalPages, 1);

			assert.strictEqual(
				response.data.every((review: Review) => review.user.id === userId),
				true,
			);
		});

		test("Should return empty paginated result when 'service.getAllByUserId' is called with user who has no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			await createReviews(generateMockInsertReviews({ count: 2 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: userId };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, 0);

			assert.strictEqual(response.meta.totalItems, 0);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.totalPages, 1);
		});

		test("Should return paginated reviews with correct pagination when 'service.getAllByUserId' is called with pageSize", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const createdReviews = await createReviews(
				generateMockInsertReviews({
					count: 8,
					options: { user: { id: userId, name: "test-user" } },
				}),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: userId };
			req.query = { pageNumber: "1", pageSize: "3" };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, 3);

			assert.strictEqual(response.meta.totalItems, createdReviews.length);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.pageSize, 3);
			assert.strictEqual(response.meta.totalPages, 3);
			assert.strictEqual(response.meta.hasNextPage, true);
			assert.strictEqual(response.meta.hasPreviousPage, false);
		});

		test("Should return only reviews for productId when 'service.getAllByUserId' is called with productId query", async () => {
			// Arrange
			const userId = generateMockObjectId();

			const createdReviews = await createReviews(
				generateMockInsertReviews({
					count: 2,
					options: { user: { id: userId, name: "test-user" } },
				}),
			);
			const productId = createdReviews[0].productId;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByUserId,
			);
			req.params = { userId: userId };
			req.query = { productId: productId, pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAllByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.meta.totalItems, 1);
			assert.strictEqual(response.data.length, 1);
			assert.strictEqual(response.data[0].productId, productId);
		});
	});

	describe("getAllByProductId", () => {
		test("Should return success response when 'service.getAllByProductId' is called with valid 'productId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByProductId,
			);
			req.params = { productId: createdReviews[0].productId };

			// Act
			await controller.getAllByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
		});

		test("Should return '200' status code when 'service.getAllByProductId' is called with valid 'productId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByProductId,
			);
			req.params = { productId: createdReviews[0].productId };

			// Act
			await controller.getAllByProductId(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return paginated reviews for specific product when 'service.getAllByProductId' is called", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { productId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 2 }),
			]);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByProductId,
			);
			req.params = { productId };

			// Act
			await controller.getAllByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, targetReviews.length);

			assert.strictEqual(response.meta.totalItems, targetReviews.length);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.totalPages, 1);

			assert.strictEqual(
				response.data.every((review: Review) => review.productId === productId),
				true,
			);
		});

		test("Should return empty paginated result when 'service.getAllByProductId' is called with product that has no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByProductId,
			);
			req.params = { productId };

			// Act
			await controller.getAllByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, 0);

			assert.strictEqual(response.meta.totalItems, 0);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.totalPages, 1);
		});

		test("Should return paginated reviews with correct pagination when 'service.getAllByProductId' is called with pageSize", async () => {
			// Arrange
			const productId = generateMockObjectId();

			const createdReviews = await createReviews(
				generateMockInsertReviews({
					count: 7,
					options: { productId },
				}),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByProductId,
			);
			req.params = { productId };
			req.query = { pageNumber: "1", pageSize: "3" };

			// Act
			await controller.getAllByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);

			assert.strictEqual(Array.isArray(response.data), true);
			assert.strictEqual(response.data.length, 3);

			assert.strictEqual(response.meta.totalItems, createdReviews.length);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.pageSize, 3);
			assert.strictEqual(response.meta.totalPages, 3);
			assert.strictEqual(response.meta.hasNextPage, true);
			assert.strictEqual(response.meta.hasPreviousPage, false);
		});

		test("Should return only reviews for userId when 'service.getAllByProductId' is called with userId query", async () => {
			// Arrange
			const productId = generateMockObjectId();

			const createdReviews = await createReviews(
				generateMockInsertReviews({
					count: 2,
					options: { productId },
				}),
			);
			const userId = createdReviews[0].user.id;

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAllByProductId,
			);
			req.params = { productId };
			req.query = { userId: userId, pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAllByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.meta.totalItems, 1);
			assert.strictEqual(response.data.length, 1);
			assert.strictEqual(response.data[0].user.id, userId);
		});
	});

	describe("update", () => {
		test("Should return success response when 'service.update' is called with 'reviewId' and valid update data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.update' is called with 'reviewId' and valid update data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.update(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return updated review when 'service.update' is called with 'reviewId' and valid update data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);
			const updateData = { comment: "UPDATED COMMENT", rating: 5 };
			req.params = { reviewId: createdReview.id };
			req.body = updateData;

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data.comment, updateData.comment);
			assert.strictEqual(response.data.rating, updateData.rating);
		});

		test("Should update only provided fields when 'service.update' is called with partial data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);
			const updateData = { comment: "UPDATED COMMENT ONLY" };
			req.params = { reviewId: createdReview.id };
			req.body = updateData;

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data.comment, updateData.comment);
			assert.strictEqual(response.data.rating, createdReview.rating); // Should remain unchanged
		});

		test("Should throw 'NotFoundError' when 'service.update' is called with non-existent 'reviewId'", async () => {
			// Arrange
			const reviewId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);
			req.params = { reviewId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.update(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					return true;
				},
			);
		});
	});

	describe("delete", () => {
		test("Should return success response when 'service.delete' is called with 'reviewId'", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.delete(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
		});

		test("Should return '204' status code when 'service.delete' is called with 'reviewId'", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.delete(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 204);
		});

		test("Should return 'data' equals to 'null' when 'service.delete' is called with 'reviewId'", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.delete(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data, null);
		});

		test("Should throw 'NotFoundError' when 'service.delete' is called with non-existent 'reviewId'", async () => {
			// Arrange
			const reviewId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);
			req.params = { reviewId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.delete(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					return true;
				},
			);
		});
	});

	describe("count", () => {
		test("Should return success response when 'service.count' is called", async () => {
			// Arrange
			await createReviews(generateMockInsertReviews({ count: 3 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.count,
			);

			// Act
			await controller.count(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.count' is called", async () => {
			// Arrange
			await createReviews(generateMockInsertReviews({ count: 3 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.count,
			);

			// Act
			await controller.count(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return 'data' type of 'number' when 'service.count' is called", async () => {
			// Arrange
			await createReviews(generateMockInsertReviews({ count: 3 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.count,
			);

			// Act
			await controller.count(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(typeof response.data, "number");
		});

		test("Should return correct count when 'service.count' is called with reviews in database", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.count,
			);

			// Act
			await controller.count(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data, createdReviews.length);
		});

		test("Should return zero when 'service.count' is called with no reviews in database", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.count,
			);

			// Act
			await controller.count(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data, 0);
		});
	});

	describe("countByUserId", () => {
		test("Should return success response when 'service.countByUserId' is called with 'userId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByUserId,
			);
			req.params = { userId: createdReviews[0].user.id };

			// Act
			await controller.countByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.countByUserId' is called with 'userId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByUserId,
			);
			req.params = { userId: createdReviews[0].user.id };

			// Act
			await controller.countByUserId(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return 'data' type of 'number' when 'service.count' is called", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByUserId,
			);
			req.params = { userId: createdReviews[0].user.id };

			// Act
			await controller.countByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(typeof response.data, "number");
		});

		test("Should return correct count for specific user when 'service.countByUserId' is called with 'userId'", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { user: { id: userId, name: "test-user" } },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 2 }),
			]);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByUserId,
			);
			req.params = { userId };

			// Act
			await controller.countByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data, targetReviews.length);
		});

		test("Should return zero when 'service.countByUserId' is called with user who has no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByUserId,
			);
			req.params = { userId };

			// Act
			await controller.countByUserId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data, 0);
		});
	});

	describe("countByProductId", () => {
		test("Should return success response when 'service.countByProductId' is called with 'productId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByProductId,
			);
			req.params = { productId: createdReviews[0].productId };

			// Act
			await controller.countByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.countByProductId' is called with 'productId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByProductId,
			);
			req.params = { productId: createdReviews[0].productId };

			// Act
			await controller.countByProductId(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return 'data' type of 'number' when 'service.count' is called", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByProductId,
			);
			req.params = { productId: createdReviews[0].productId };

			// Act
			await controller.countByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(typeof response.data, "number");
		});

		test("Should return correct count for specific product when 'service.countByProductId' is called with 'productId'", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 4,
				options: { productId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 2 }),
			]);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByProductId,
			);
			req.params = { productId };

			// Act
			await controller.countByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data, targetReviews.length);
		});

		test("Should return zero when 'service.countByProductId' is called with product that has no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.countByProductId,
			);
			req.params = { productId };

			// Act
			await controller.countByProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data, 0);
		});
	});

	describe("existsById", () => {
		test("Should return success response when 'service.existsById' is called with valid data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.existsById,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.existsById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.existsById' is called with 'reviewId'", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.existsById,
			);
			req.params = { reviewId: createdReview.id };

			// Act
			await controller.existsById(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return 'review id' when 'service.existsById' is called with existing 'reviewId'", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 5 }),
			);

			const targetReview = createdReviews[0];

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.existsById,
			);
			req.params = { reviewId: targetReview.id };

			// Act
			await controller.existsById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data.id, targetReview.id);
		});

		test("Should throw 'NotFoundError' when 'service.existsById' is called with non-existent review id", async () => {
			// Arrange
			const reviewId = generateMockObjectId();
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.existsById,
			);
			req.params = { reviewId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.existsById(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					return true;
				},
			);
		});
	});

	describe("existsByUserIdAndProductId", () => {
		test("Should return success response when 'service.existsByUserIdAndProductId' is called with valid data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.existsByUserIdAndProductId,
			);
			req.params = {
				productId: createdReview.productId,
				userId: createdReview.user.id,
			};

			// Act
			await controller.existsByUserIdAndProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.existsByUserIdAndProductId' is called with valid data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.existsByUserIdAndProductId,
			);
			req.params = {
				productId: createdReview.productId,
				userId: createdReview.user.id,
			};

			// Act
			await controller.existsByUserIdAndProductId(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return 'review id' when 'service.existsByUserIdAndProductId' is called with existing combination", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);
			const targetReview = createdReviews[0];

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.existsByUserIdAndProductId,
			);
			req.params = {
				productId: targetReview.productId,
				userId: targetReview.user.id,
			};

			// Act
			await controller.existsByUserIdAndProductId(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data.id, targetReview.id);
		});

		test("Should throw 'NotFoundError' when 'service.existsByUserIdAndProductId' is called with non-existent combination", async () => {
			// Arrange
			const mockId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.existsByUserIdAndProductId,
			);
			req.params = {
				productId: mockId,
				userId: mockId,
			};

			// Act & Assert
			await assert.rejects(
				async () => await controller.existsByUserIdAndProductId(req, res, next),
				(error: unknown) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					return true;
				},
			);
		});
	});
});
