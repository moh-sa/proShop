import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import type { CreateReview } from "../../types/index.js";

import {
	DatabaseDuplicateKeyError,
	DatabaseValidationError,
} from "../../errors/index.js";
import { ProductModel } from "../../models/product.model.js";
import { ReviewModel } from "../../models/review.model.js";
import {
	productRepository,
	ReviewRepository,
} from "../../repositories/index.js";
import {
	generateMockInsertProductWithStringImage,
	generateMockObjectId,
} from "../mocks/index.js";
import {
	generateMockInsertReview,
	generateMockInsertReviews,
} from "../mocks/review.mock.js";
import {
	connectTestDatabase,
	createProduct,
	createReview,
	createReviews,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("Review Repository 〖 Integration Tests 〗", async () => {
	const reviewRepository = new ReviewRepository();

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => {
		await ReviewModel.deleteMany({});
		await ProductModel.deleteMany({});
	});

	describe("create", () => {
		test("should create a review when 'create' is called with valid review data", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();

			// Act
			const createdReview = await reviewRepository.create(mockReview);

			// Assert
			assert.ok(createdReview.success);
			assert.ok(createdReview.data);
			assert.ok(createdReview.data.id, "Review should have an ID");
			assert.strictEqual(createdReview.data.name, mockReview.name);
			assert.strictEqual(createdReview.data.rating, mockReview.rating);
			assert.strictEqual(createdReview.data.comment, mockReview.comment);
			assert.deepStrictEqual(createdReview.data.user, mockReview.user);
			assert.deepStrictEqual(createdReview.data.product, mockReview.product);
		});

		test("should throw 'DatabaseDuplicateKeyError' when 'create' is called with duplicate user-product combination", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();
			await createReview(mockReview);

			// Act
			const result = await reviewRepository.create(mockReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});
	});

	describe("getById", () => {
		test("should return review when 'getById' is called with existing review ID", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();

			const createdReview = await createReview(mockReview);

			// Act
			const retrievedReview = await reviewRepository.getById({
				reviewId: createdReview.id,
			});

			// Assert
			assert.ok(retrievedReview.success);
			assert.ok(retrievedReview.data);
			assert.strictEqual(retrievedReview.data.name, mockReview.name);
			assert.strictEqual(retrievedReview.data.rating, mockReview.rating);
			assert.strictEqual(retrievedReview.data.comment, mockReview.comment);
			assert.deepStrictEqual(retrievedReview.data.user, mockReview.user);
			assert.deepStrictEqual(retrievedReview.data.product, mockReview.product);
		});

		test("should return null when 'getById' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const review = await reviewRepository.getById({
				reviewId: nonExistentId,
			});

			// Assert
			assert.strictEqual(review.success, true);
			assert.strictEqual(review.data, null);
		});

		test("should throw 'DatabaseValidationError' when 'getById' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await reviewRepository.getById({ reviewId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("getAll", () => {
		test("should return empty paginated result when 'getAll' is called with no reviews in database", async () => {
			// Act
			const reviews = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 0);

			assert.strictEqual(reviews.data.meta.totalItems, 0);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);
		});

		test("should return paginated reviews when 'getAll' is called with multiple reviews in database", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			// Act
			const reviews = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, createdReviews.length);

			assert.strictEqual(reviews.data.meta.totalItems, createdReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);

			reviews.data.items.forEach((review) => {
				const targetReview = createdReviews.find((r) => r.id === review.id);

				assert.ok(targetReview);
			});
		});

		test("should return paginated reviews with correct pagination when 'getAll' is called with pageSize", async () => {
			// Arrange
			await createReviews(generateMockInsertReviews({ count: 15 }));

			// Act
			const reviews = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 5,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 5);

			assert.strictEqual(reviews.data.meta.totalItems, 15);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.pageSize, 5);
			assert.strictEqual(reviews.data.meta.totalPages, 3);
			assert.strictEqual(reviews.data.meta.hasNextPage, true);
			assert.strictEqual(reviews.data.meta.hasPreviousPage, false);
		});

		test("should return second page of reviews when 'getAll' is called with pageNumber 2", async () => {
			// Arrange
			await createReviews(generateMockInsertReviews({ count: 15 }));

			// Act
			const reviews = await reviewRepository.getAll({
				pageNumber: 2,
				pageSize: 5,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 5);

			assert.strictEqual(reviews.data.meta.totalItems, 15);
			assert.strictEqual(reviews.data.meta.currentPage, 2);
			assert.strictEqual(reviews.data.meta.pageSize, 5);
			assert.strictEqual(reviews.data.meta.totalPages, 3);
			assert.strictEqual(reviews.data.meta.hasNextPage, true);
			assert.strictEqual(reviews.data.meta.hasPreviousPage, true);
		});

		test("should return only reviews for a product when 'getAll' is called with filters.productId", async () => {
			// Arrange
			const targetProductId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { product: targetProductId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({
					count: 2,
				}),
			]);

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { productId: targetProductId },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.meta.totalItems, 3);
			assert.strictEqual(
				result.data.items.every((r) => r.product === targetProductId),
				true,
			);
		});

		test("should return only reviews for a user when 'getAll' is called with filters.userId", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 2,
				options: { user: userId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 3 }),
			]);

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { userId },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.meta.totalItems, 2);
			assert.strictEqual(
				result.data.items.every((r) => r.user === userId),
				true,
			);
		});

		test("should return reviews matching product and user when 'getAll' is called with both filter fields", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 5 }),
			);
			const targetReview = createdReviews[0];
			const userId = targetReview.user;
			const productId = targetReview.product;

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: {
					productId,
					userId,
				},
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.meta.totalItems, 1);
			assert.strictEqual(
				result.data.items.every(
					(r) => r.product === productId && r.user === userId,
				),
				true,
			);
		});

		test("should return reviews sorted by rating when 'getAll' is called with sort", async () => {
			// Arrange
			const productId = generateMockObjectId();

			const createdReviews = await createReviews(
				generateMockInsertReviews({
					count: 3,
					options: { product: productId },
				}),
			);

			const expectedSortedRatings = createdReviews
				.sort((a, b) => b.rating - a.rating)
				.map((review) => review.rating);

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				sort: { rating: "desc" },
				filters: { productId },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.items.length, 3);

			const resultRatings = result.data.items.map((r) => r.rating);
			assert.deepStrictEqual(resultRatings, expectedSortedRatings);
		});

		test("should return only selected fields when 'getAll' is called with select", async () => {
			// Arrange
			await createReviews(generateMockInsertReviews({ count: 2 }));

			const expectedKeys = ["id", "comment", "rating"].sort();

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				select: { comment: true, rating: true },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.items.length, 2);
			for (const item of result.data.items) {
				const keys = Object.keys(item).sort();
				assert.deepStrictEqual(keys, expectedKeys);
			}
		});
	});

	describe("getAllByUserId", () => {
		test("should return user's paginated reviews when 'getAllByUserId' is called with valid user ID", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { user: userId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 2 }),
			]);

			// Act
			const reviews = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, targetReviews.length);

			assert.strictEqual(reviews.data.meta.totalItems, targetReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);

			assert.strictEqual(
				reviews.data.items.every((r) => r.user === userId),
				true,
			);
		});

		test("should return empty paginated result when 'getAllByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			await createReviews(generateMockInsertReviews({ count: 2 }));

			// Act
			const reviews = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 0);

			assert.strictEqual(reviews.data.meta.totalItems, 0);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);
		});

		test("should return paginated user reviews with correct pagination when 'getAllByUserId' is called with pageSize", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 8,
				options: { user: userId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 5 }),
			]);

			// Act
			const reviews = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 3,
				userId,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 3);

			assert.strictEqual(reviews.data.meta.totalItems, targetReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.pageSize, 3);
			assert.strictEqual(reviews.data.meta.totalPages, 3);
			assert.strictEqual(reviews.data.meta.hasNextPage, true);
			assert.strictEqual(reviews.data.meta.hasPreviousPage, false);

			assert.strictEqual(
				reviews.data.items.every((r) => r.user === userId),
				true,
			);
		});

		test("should narrow reviews when 'getAllByUserId' is called with filters.productId", async () => {
			// Arrange
			const userId = generateMockObjectId();

			const createdReviews = await createReviews(
				generateMockInsertReviews({
					count: 2,
					options: { user: userId },
				}),
			);

			const productId = createdReviews[0].product;

			// Act
			const result = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
				filters: { productId },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.meta.totalItems, 1);
			assert.strictEqual(
				result.data.items.every(
					(r) => r.user === userId && r.product === productId,
				),
				true,
			);
		});

		test("should return 'DatabaseValidationError' when 'getAllByUserId' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("getAllByProductId", () => {
		test("should return product's paginated reviews when 'getAllByProductId' is called with valid product ID", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 2 }),
			]);

			// Act
			const reviews = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, targetReviews.length);

			assert.strictEqual(reviews.data.meta.totalItems, targetReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);

			assert.strictEqual(
				reviews.data.items.every((r) => r.product === productId),
				true,
			);
		});

		test("should return empty paginated result when 'getAllByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			// Act
			const reviews = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 0);

			assert.strictEqual(reviews.data.meta.totalItems, 0);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);
		});

		test("should return paginated product reviews with correct pagination when 'getAllByProductId' is called with pageSize", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 7,
				options: { product: productId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 4 }),
			]);

			// Act
			const reviews = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 3,
				productId,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 3);

			assert.strictEqual(reviews.data.meta.totalItems, targetReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.pageSize, 3);
			assert.strictEqual(reviews.data.meta.totalPages, 3);
			assert.strictEqual(reviews.data.meta.hasNextPage, true);
			assert.strictEqual(reviews.data.meta.hasPreviousPage, false);

			assert.strictEqual(
				reviews.data.items.every((r) => r.product === productId),
				true,
			);
		});

		test("should narrow reviews when 'getAllByProductId' is called with filters.userId", async () => {
			// Arrange
			const productId = generateMockObjectId();

			const createdReviews = await createReviews(
				generateMockInsertReviews({
					count: 5,
					options: { product: productId },
				}),
			);

			const userId = createdReviews[0].user;

			// Act
			const reviews = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId,
				filters: { userId },
			});

			// Assert
			assert.ok(reviews.success);
			assert.strictEqual(reviews.data.meta.totalItems, 1);
			assert.strictEqual(
				reviews.data.items.every(
					(r) => r.product === productId && r.user === userId,
				),
				true,
			);
		});

		test("should return 'DatabaseValidationError' when 'getAllByProductId' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("update", () => {
		test("should update review when 'update' is called with valid review ID and data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const updateData = {
				comment: "Updated comment",
				rating: 5,
			};

			// Act
			const updatedReview = await reviewRepository.update({
				data: updateData,
				reviewId: createdReview.id,
			});

			// Assert
			assert.ok(updatedReview.success);
			assert.ok(updatedReview.data);
			assert.strictEqual(updatedReview.data.rating, updateData.rating);
			assert.strictEqual(updatedReview.data.comment, updateData.comment);

			// Verify other fields remain unchanged
			assert.strictEqual(updatedReview.data.name, createdReview.name);
			assert.deepStrictEqual(updatedReview.data.user, createdReview.user);
			assert.deepStrictEqual(updatedReview.data.product, createdReview.product);
		});

		test("should return null when 'update' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();
			const updateData = { comment: "Updated comment", rating: 5 };

			// Act
			const updatedReview = await reviewRepository.update({
				data: updateData,
				reviewId: nonExistentId,
			});

			// Assert
			assert.strictEqual(updatedReview.success, true);
			assert.strictEqual(updatedReview.data, null);
		});
	});

	describe("delete", () => {
		test("should delete review when 'delete' is called with existing review ID", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const reviewId = createdReview.id;

			// Act
			const deletedReview = await reviewRepository.delete({
				reviewId,
			});

			// Assert
			assert.ok(deletedReview.success);
			assert.ok(deletedReview.data);
			assert.strictEqual(deletedReview.data.name, createdReview.name);
			assert.strictEqual(deletedReview.data.rating, createdReview.rating);
			assert.strictEqual(deletedReview.data.comment, createdReview.comment);
			assert.deepStrictEqual(deletedReview.data.user, createdReview.user);
			assert.deepStrictEqual(deletedReview.data.product, createdReview.product);

			// Verify review is actually deleted
			const reviewInDb = await reviewRepository.getById({ reviewId });
			assert.ok(reviewInDb.success);
			assert.strictEqual(reviewInDb.data, null);
		});

		test("should return null when 'delete' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const deletedReview = await reviewRepository.delete({
				reviewId: nonExistentId,
			});

			// Assert
			assert.strictEqual(deletedReview.success, true);
			assert.strictEqual(deletedReview.data, null);
		});

		test("should throw 'DatabaseValidationError' when 'delete' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await reviewRepository.delete({ reviewId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("count", () => {
		test("should return correct count when 'count' is called with reviews in database", async () => {
			// Arrange
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			// Act
			const count = await reviewRepository.count();

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, createdReviews.length);
		});

		test("should return zero when 'count' is called with empty database", async () => {
			// Act
			const count = await reviewRepository.count();

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, 0);
		});
	});

	describe("countByUserId", () => {
		test("should return correct count when 'countByUserId' is called with user having reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { user: userId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 2 }),
			]);

			// Act
			const count = await reviewRepository.countByUserId({ userId });

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, targetReviews.length);
		});

		test("should return zero when 'countByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			// Act
			const count = await reviewRepository.countByUserId({ userId });

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, 0);
		});

		test("should throw 'DatabaseValidationError' when 'countByUserId' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await reviewRepository.countByUserId({
				userId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("countByProductId", () => {
		test("should return correct count when 'countByProductId' is called with product having reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 2 }),
			]);

			// Act
			const count = await reviewRepository.countByProductId({ productId });

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, targetReviews.length);
		});

		test("should return zero when 'countByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 2 }));

			// Act
			const count = await reviewRepository.countByProductId({ productId });

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, 0);
		});

		test("should throw 'DatabaseValidationError' when 'countByProductId' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await reviewRepository.countByProductId({
				productId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("existsById", () => {
		test("should return review ID when 'existsById' is called with existing review ID", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());
			const reviewId = createdReview.id;

			// Act
			const result = await reviewRepository.existsById({
				reviewId,
			});

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.deepStrictEqual(result.data.id, reviewId);
		});

		test("should return null when 'existsById' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await reviewRepository.existsById({
				reviewId: nonExistentId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("should throw 'DatabaseValidationError' when 'existsById' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await reviewRepository.existsById({ reviewId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("existsByUserIdAndProductId", () => {
		test("should return review ID when 'existsByUserIdAndProductId' is called with existing combination", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			// Act
			const result = await reviewRepository.existsByUserIdAndProductId({
				productId: createdReview.product,
				userId: createdReview.user,
			});

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.deepStrictEqual(result.data.id, createdReview.id);
		});

		test("should return null when 'existsByUserIdAndProductId' is called with non-existent combination", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const productId = generateMockObjectId();

			// Act
			const result = await reviewRepository.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("should throw 'DatabaseValidationError' when 'existsByUserIdAndProductId' is called with invalid ObjectIds", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await reviewRepository.existsByUserIdAndProductId({
				productId: generateMockObjectId(),
				userId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("Side Effects", () => {
		test("should update product rating and numReviews when review is created", async (t) => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);
			const productId = createdProduct.id;

			const mockReview = generateMockInsertReview({
				product: productId,
				rating: 4,
			});

			// Act
			await reviewRepository.create(mockReview);

			// Assert
			const updatedProduct = await productRepository.getById({ productId });
			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);
			assert.strictEqual(updatedProduct.data.rating, 4.0);
			assert.strictEqual(updatedProduct.data.numReviews, 1);
		});

		test("should update product rating and numReviews when review is updated", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);
			const productId = createdProduct.id;

			const createdReview = await createReview(
				generateMockInsertReview({
					product: productId,
					rating: 4,
				}),
			);

			const updateData: Partial<CreateReview> = { rating: 5 };

			// Act
			await reviewRepository.update({
				data: updateData,
				reviewId: createdReview.id,
			});

			// Assert
			const updatedProduct = await productRepository.getById({ productId });

			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);
			assert.strictEqual(updatedProduct.data.rating, updateData.rating);
			assert.strictEqual(updatedProduct.data.numReviews, 1);
		});

		test("should update product rating and numReviews when review is deleted", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const productId = createdProduct.id;

			const createdReview = await createReview(
				generateMockInsertReview({
					product: productId,
					rating: 4,
				}),
			);

			// Act
			await reviewRepository.delete({ reviewId: createdReview.id });

			// Assert
			const updatedProduct = await productRepository.getById({ productId });
			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);

			assert.strictEqual(updatedProduct.data.rating, 0);
			assert.strictEqual(updatedProduct.data.numReviews, 0);
		});
	});
});
