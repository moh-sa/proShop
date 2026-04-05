import type { Types } from "mongoose";

import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import type { InsertReview } from "../../types/index.js";

import {
	DatabaseDuplicateKeyError,
	DatabaseValidationError,
} from "../../errors/index.js";
import { ProductModel } from "../../models/product.model.js";
import { ReviewModel } from "../../models/review.model.js";
import { ReviewRepository } from "../../repositories/index.js";
import {
	generateMockObjectId,
	generateMockSelectProduct,
} from "../mocks/index.js";
import {
	generateMockInsertReview,
	generateMockInsertReviews,
	generateMockSelectReview,
	generateMockSelectReviews,
} from "../mocks/review.mock.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

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
			assert.ok(createdReview.data._id, "Review should have an ID");
			assert.strictEqual(createdReview.data.name, mockReview.name);
			assert.strictEqual(createdReview.data.rating, mockReview.rating);
			assert.strictEqual(createdReview.data.comment, mockReview.comment);
			assert.deepStrictEqual(createdReview.data.user, mockReview.user);
			assert.deepStrictEqual(createdReview.data.product, mockReview.product);
		});

		test("should throw 'DatabaseDuplicateKeyError' when 'create' is called with duplicate user-product combination", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();
			await reviewRepository.create(mockReview);

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
			const createdReview = await reviewRepository.create(mockReview);
			assert.ok(createdReview.success);

			// Act
			const retrievedReview = await reviewRepository.getById({
				reviewId: createdReview.data._id,
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
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

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
			const mockReviews = generateMockSelectReviews({ count: 3 });
			await ReviewModel.insertMany(mockReviews);

			// Act
			const reviews = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, mockReviews.length);

			assert.strictEqual(reviews.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);

			reviews.data.items.forEach((review) => {
				const mockReview = mockReviews.find(
					(mr) => mr._id.toString() === review._id.toString(),
				);
				assert.ok(
					mockReview,
					"Each returned review should match a mock review",
				);
			});
		});

		test("should return paginated reviews with correct pagination when 'getAll' is called with pageSize", async () => {
			// Arrange
			const mockReviews = generateMockSelectReviews({ count: 15 });
			await ReviewModel.insertMany(mockReviews);

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
			const mockReviews = generateMockSelectReviews({ count: 15 });
			await ReviewModel.insertMany(mockReviews);

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
			const otherProductId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { product: targetProductId },
			});
			const otherReviews = generateMockInsertReviews({
				count: 2,
				options: { product: otherProductId },
			});

			await ReviewModel.insertMany([...targetReviews, ...otherReviews]);

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { productId: targetProductId.toString() },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.meta.totalItems, 3);
			assert.strictEqual(
				result.data.items.every(
					(r) => r.product.toString() === targetProductId.toString(),
				),
				true,
			);
		});

		test("should return only reviews for a user when 'getAll' is called with filters.userId", async () => {
			// Arrange — one review per (user, product)
			const userId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 2,
				options: { user: userId },
			});

			const otherReviews = generateMockSelectReviews({ count: 3 });
			await ReviewModel.insertMany([...targetReviews, ...otherReviews]);

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { userId: userId.toString() },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.meta.totalItems, 2);
			assert.strictEqual(
				result.data.items.every((r) => r.user.toString() === userId.toString()),
				true,
			);
		});

		test("should return reviews matching product and user when 'getAll' is called with both filter fields", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const productId = generateMockObjectId();

			const targetReview = generateMockInsertReview({
				product: productId,
				user: userId,
			});
			const otherReviews = [
				...generateMockInsertReviews({ count: 2 }),
				generateMockInsertReview({ user: userId }),
			];

			await ReviewModel.insertMany([targetReview, ...otherReviews]);

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: {
					productId: productId.toString(),
					userId: userId.toString(),
				},
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.meta.totalItems, 1);
			assert.strictEqual(
				result.data.items.every(
					(r) =>
						r.product.toString() === productId.toString() &&
						r.user.toString() === userId.toString(),
				),
				true,
			);
		});

		test("should return reviews sorted by rating when 'getAll' is called with sort", async () => {
			// Arrange
			const productId = generateMockObjectId();

			const reviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			}).map((review, index) => ({ ...review, rating: index + 2 }));

			const expectedSortedRatings = reviews
				.sort((a, b) => b.rating - a.rating)
				.map((review) => review.rating);

			await ReviewModel.insertMany(reviews);

			// Act
			const result = await reviewRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				sort: { rating: "desc" },
				filters: { productId: productId.toString() },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.items.length, 3);

			const resultRatings = result.data.items.map((r) => r.rating);
			assert.deepStrictEqual(resultRatings, expectedSortedRatings);
		});

		test("should return only selected fields when 'getAll' is called with select", async () => {
			// Arrange
			const mockReviews = generateMockSelectReviews({ count: 2 });
			await ReviewModel.insertMany(mockReviews);

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
				assert.deepStrictEqual(keys, ["_id", "comment", "rating"]);
			}
		});
	});

	describe("getAllByUserId", () => {
		test("should return user's paginated reviews when 'getAllByUserId' is called with valid user ID", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockReviews = generateMockSelectReviews({
				count: 3,
				options: { user: userId },
			});
			const otherReviews = generateMockSelectReviews({ count: 2 });
			await ReviewModel.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const reviews = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId.toString(),
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, mockReviews.length);

			assert.strictEqual(reviews.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);

			assert.strictEqual(
				reviews.data.items.every(
					(r) => r.user.toString() === userId.toString(),
				),
				true,
			);
		});

		test("should return empty paginated result when 'getAllByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockReviews = generateMockSelectReviews({ count: 2 });
			await ReviewModel.insertMany(mockReviews);

			// Act
			const reviews = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId.toString(),
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
			const mockReviews = generateMockSelectReviews({
				count: 8,
				options: { user: userId },
			});
			const otherReviews = generateMockSelectReviews({ count: 5 });
			await ReviewModel.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const reviews = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 3,
				userId: userId.toString(),
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 3);

			assert.strictEqual(reviews.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.pageSize, 3);
			assert.strictEqual(reviews.data.meta.totalPages, 3);
			assert.strictEqual(reviews.data.meta.hasNextPage, true);
			assert.strictEqual(reviews.data.meta.hasPreviousPage, false);

			assert.strictEqual(
				reviews.data.items.every(
					(r) => r.user.toString() === userId.toString(),
				),
				true,
			);
		});

		test("should narrow reviews when 'getAllByUserId' is called with filters.productId", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const reviews = generateMockInsertReviews({
				count: 2,
				options: { user: userId },
			});
			const productId = reviews[0].product;

			await ReviewModel.insertMany(reviews);

			// Act
			const result = await reviewRepository.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId.toString(),
				filters: { productId: productId.toString() },
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.meta.totalItems, 1);
			assert.strictEqual(
				result.data.items.every(
					(r) =>
						r.user.toString() === userId.toString() &&
						r.product.toString() === productId.toString(),
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
			const mockReviews = generateMockSelectReviews({
				count: 3,
				options: { product: productId },
			});
			const otherReviews = generateMockSelectReviews({ count: 2 });
			await ReviewModel.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const reviews = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId.toString(),
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, mockReviews.length);

			assert.strictEqual(reviews.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.totalPages, 1);

			assert.strictEqual(
				reviews.data.items.every(
					(r) => r.product.toString() === productId.toString(),
				),
				true,
			);
		});

		test("should return empty paginated result when 'getAllByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const mockReviews = generateMockSelectReviews({ count: 2 });
			await ReviewModel.insertMany(mockReviews);

			// Act
			const reviews = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId.toString(),
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
			const mockReviews = generateMockSelectReviews({
				count: 7,
				options: { product: productId },
			});
			const otherReviews = generateMockSelectReviews({ count: 4 });
			await ReviewModel.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const reviews = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 3,
				productId: productId.toString(),
			});

			// Assert
			assert.ok(reviews.success);

			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 3);

			assert.strictEqual(reviews.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(reviews.data.meta.currentPage, 1);
			assert.strictEqual(reviews.data.meta.pageSize, 3);
			assert.strictEqual(reviews.data.meta.totalPages, 3);
			assert.strictEqual(reviews.data.meta.hasNextPage, true);
			assert.strictEqual(reviews.data.meta.hasPreviousPage, false);

			assert.strictEqual(
				reviews.data.items.every(
					(r) => r.product.toString() === productId.toString(),
				),
				true,
			);
		});

		test("should narrow reviews when 'getAllByProductId' is called with filters.userId", async () => {
			// Arrange
			const targetReview = generateMockInsertReview();
			const userId = targetReview.user;
			const productId = targetReview.product;

			const otherReviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			});

			await ReviewModel.insertMany([targetReview, ...otherReviews]);

			// Act
			const reviews = await reviewRepository.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId.toString(),
				filters: { userId: userId.toString() },
			});

			// Assert
			assert.ok(reviews.success);
			assert.strictEqual(reviews.data.meta.totalItems, 1);
			assert.strictEqual(
				reviews.data.items.every(
					(r) =>
						r.product.toString() === productId.toString() &&
						r.user.toString() === userId.toString(),
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
			const mockReview = generateMockInsertReview();
			const createdReview = await reviewRepository.create(mockReview);
			assert.ok(createdReview.success);
			const updateData = {
				comment: "Updated comment",
				rating: 5,
			};

			// Act
			const updatedReview = await reviewRepository.update({
				data: updateData,
				reviewId: createdReview.data._id,
			});

			// Assert
			assert.ok(updatedReview.success);
			assert.ok(updatedReview.data);
			assert.strictEqual(updatedReview.data.rating, updateData.rating);
			assert.strictEqual(updatedReview.data.comment, updateData.comment);

			// Verify other fields remain unchanged
			assert.strictEqual(updatedReview.data.name, mockReview.name);
			assert.deepStrictEqual(updatedReview.data.user, mockReview.user);
			assert.deepStrictEqual(updatedReview.data.product, mockReview.product);
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
			const mockReview = generateMockInsertReview();
			const createdReview = await reviewRepository.create(mockReview);
			assert.ok(createdReview.success);

			// Act
			const deletedReview = await reviewRepository.delete({
				reviewId: createdReview.data._id,
			});

			// Assert
			assert.ok(deletedReview.success);
			assert.ok(deletedReview.data);
			assert.strictEqual(deletedReview.data.name, mockReview.name);
			assert.strictEqual(deletedReview.data.rating, mockReview.rating);
			assert.strictEqual(deletedReview.data.comment, mockReview.comment);
			assert.deepStrictEqual(deletedReview.data.user, mockReview.user);
			assert.deepStrictEqual(deletedReview.data.product, mockReview.product);

			// Verify review is actually deleted
			const reviewInDb = await ReviewModel.findById(
				createdReview.data._id,
			).lean();
			assert.strictEqual(reviewInDb, null);
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
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

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
			const mockReviews = generateMockSelectReviews({ count: 3 });
			await ReviewModel.insertMany(mockReviews);

			// Act
			const count = await reviewRepository.count();

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, mockReviews.length);
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
			const mockReviews = generateMockSelectReviews({
				count: 3,
				options: { user: userId },
			});
			const otherReviews = generateMockSelectReviews({ count: 2 });
			await ReviewModel.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const count = await reviewRepository.countByUserId({ userId });

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, mockReviews.length);
		});

		test("should return zero when 'countByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			// Add some reviews by other users
			await ReviewModel.insertMany(generateMockSelectReviews({ count: 2 }));

			// Act
			const count = await reviewRepository.countByUserId({ userId });

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, 0);
		});

		test("should throw 'DatabaseValidationError' when 'countByUserId' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

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
			const mockReviews = generateMockSelectReviews({
				count: 3,
				options: { product: productId },
			});
			const otherReviews = generateMockSelectReviews({ count: 2 });
			await ReviewModel.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const count = await reviewRepository.countByProductId({ productId });

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, mockReviews.length);
		});

		test("should return zero when 'countByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			// Add some reviews for other products
			await ReviewModel.insertMany(generateMockSelectReviews({ count: 2 }));

			// Act
			const count = await reviewRepository.countByProductId({ productId });

			// Assert
			assert.ok(count.success);
			assert.strictEqual(count.data, 0);
		});

		test("should throw 'DatabaseValidationError' when 'countByProductId' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

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
			const mockReview = generateMockInsertReview();
			const createdReview = await reviewRepository.create(mockReview);
			assert.ok(createdReview.success);

			// Act
			const result = await reviewRepository.existsById({
				reviewId: createdReview.data._id,
			});

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.deepStrictEqual(result.data._id, createdReview.data._id);
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
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

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
			const mockReview = generateMockInsertReview();
			const createdReview = await reviewRepository.create(mockReview);
			assert.ok(createdReview.success);

			// Act
			const result = await reviewRepository.existsByUserIdAndProductId({
				productId: mockReview.product,
				userId: mockReview.user,
			});

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.deepStrictEqual(result.data._id, createdReview.data._id);
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
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

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
		test("should update product rating and numReviews when review is created", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id;
			const mockReview = generateMockInsertReview({
				product: productId,
				rating: 4,
			});
			await ProductModel.create(mockProduct);

			// Act
			await reviewRepository.create(mockReview);

			// Assert
			const updatedProduct = await ProductModel.findById(productId).lean();
			assert.ok(updatedProduct);
			assert.strictEqual(updatedProduct.rating, 4.0);
			assert.strictEqual(updatedProduct.numReviews, 1);
		});

		test("should update product rating and numReviews when review is updated", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id;
			const mockReview = generateMockSelectReview({
				product: productId,
				rating: 4,
			});
			const updateData: Partial<InsertReview> = { rating: 5 };
			await ProductModel.create(mockProduct);
			await reviewRepository.create(mockReview);

			// Act
			await reviewRepository.update({
				data: updateData,
				reviewId: mockReview._id,
			});

			// Assert
			const updatedProduct = await ProductModel.findById(productId).lean();

			assert.ok(updatedProduct);
			assert.strictEqual(updatedProduct.rating, updateData.rating);
			assert.strictEqual(updatedProduct.numReviews, 1);
		});

		test("should update product rating and numReviews when review is deleted", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id;
			const mockReview = generateMockSelectReview({
				product: productId,
				rating: 4,
			});
			await ProductModel.create(mockProduct);
			await ReviewModel.create(mockReview);

			// Act
			await reviewRepository.delete({ reviewId: mockReview._id });

			// Assert
			const updatedProduct = await ProductModel.findById(productId).lean();

			assert.ok(updatedProduct);
			assert.strictEqual(updatedProduct.rating, 0);
			assert.strictEqual(updatedProduct.numReviews, 0);
		});
	});
});
