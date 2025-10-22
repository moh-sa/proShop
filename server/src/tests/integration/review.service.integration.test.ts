import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import type { InsertReview } from "../../types/index.js";

import {
	DatabaseDuplicateKeyError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import Product from "../../models/product.model.js";
import Review from "../../models/review.model.js";
import User from "../../models/user.model.js";
import { ReviewService } from "../../services/review.service.js";
import {
	generateMockInsertProductWithStringImage,
	generateMockInsertReview,
	generateMockInsertReviews,
	generateMockObjectId,
	generateMockSelectProduct,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("Review Service 〖 Integration Tests 〗", () => {
	const reviewService = new ReviewService();

	function calculateAvgRating(reviews: Array<InsertReview>): number {
		const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
		const avg = sum / reviews.length;
		const float = parseFloat(avg.toFixed(1));
		return float;
	}

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(async () => {
		await Review.deleteMany({});
		await Product.deleteMany({});
		await User.deleteMany({});
	});

	describe("create", () => {
		test("Should create a new review when 'repo.create' is called with valid review data", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();

			// Act
			const result = await reviewService.create(mockReview);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockReview.name);
			assert.strictEqual(result.data.rating, mockReview.rating);
			assert.strictEqual(result.data.comment, mockReview.comment);
			assert.strictEqual(
				result.data.user.toString(),
				mockReview.user.toString(),
			);
			assert.strictEqual(
				result.data.product.toString(),
				mockReview.product.toString(),
			);
		});

		test("Should update product 'rating' and 'numReviews' when 'repo.create' is called with valid review data", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithStringImage();
			const product = await Product.create(mockProduct);
			const mockReview = generateMockInsertReview({ product: product._id });

			// Act
			const result = await reviewService.create(mockReview);

			// Assert
			assert.strictEqual(result.success, true);

			const updatedProduct = await Product.findById(product._id);
			assert.ok(updatedProduct);
			assert.strictEqual(updatedProduct.rating, mockReview.rating);
			assert.strictEqual(updatedProduct.numReviews, 1);
		});

		test("Should update the product 'rating' and 'numReviews' when 'repo.create' is called multiple times with valid review data", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const mockReviews = generateMockInsertReviews({
				count: 3,
				options: { product: mockProduct._id },
			});
			await Product.create(mockProduct);

			// Act
			const results = await Promise.all(
				mockReviews.map(async (review) => await reviewService.create(review)),
			);

			// Assert
			results.forEach((result) => assert.strictEqual(result.success, true));

			const updatedProduct = await Product.findById(mockProduct._id);
			assert.ok(updatedProduct);
			assert.strictEqual(updatedProduct.numReviews, mockReviews.length);
			assert.strictEqual(
				updatedProduct.rating,
				calculateAvgRating(mockReviews),
			);
		});

		test("Should return 'DatabaseDuplicateKeyError' when 'repo.create' is called with duplicate user-product review", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();
			const firstResult = await reviewService.create(mockReview);
			assert.ok(firstResult.success);

			// Act
			const result = await reviewService.create(mockReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});

		test("Should return 'ValidationError' when 'repo.create' is called without 'rating' required field", async () => {
			// Arrange
			const { rating: _, ...mockInsertReview } = generateMockInsertReview();

			// Act
			// @ts-expect-error - test case
			const result = await reviewService.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'repo.create' is called without 'comment' required field", async () => {
			// Arrange
			const { comment: _, ...mockInsertReview } = generateMockInsertReview();

			// Act
			// @ts-expect-error - test case
			const result = await reviewService.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'repo.create' is called without 'product' required field", async () => {
			// Arrange
			const { product: _, ...mockInsertReview } = generateMockInsertReview();

			// Act
			// @ts-expect-error - test case
			const result = await reviewService.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'service.create' is called with 'rating' out of range 0-5", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				rating: 6,
			});

			// Act
			const result = await reviewService.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'repo.create' is called with 'product' being invalid objectId", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				// @ts-expect-error - test case
				product: "invalid-product-id",
			});

			// Act
			const result = await reviewService.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getById", () => {
		test("Should return review when 'repo.getById' is called with valid review ID", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();
			const createdResult = await reviewService.create(mockReview);
			assert.ok(createdResult.success);

			// Act
			const result = await reviewService.getById({
				reviewId: createdResult.data._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockReview.name);
			assert.strictEqual(result.data.rating, mockReview.rating);
			assert.strictEqual(result.data.comment, mockReview.comment);
			assert.deepStrictEqual(result.data.user, mockReview.user);
			assert.deepStrictEqual(result.data.product, mockReview.product);
		});

		test("Should return 'NotFoundError' when 'repo.getById' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await reviewService.getById({
				reviewId: nonExistentId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.getById' is called with 'reviewId' being invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act
			const result = await reviewService.getById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAll", () => {
		test("Should return paginated reviews when 'repo.getAll' is called with multiple reviews in database", async () => {
			// Arrange
			const mockReviews = generateMockInsertReviews({ count: 3 });
			await Review.insertMany(mockReviews);

			// Act
			const result = await reviewService.getAll({ pageNumber: "1" });

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, mockReviews.length);

			assert.strictEqual(result.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);

			result.data.items.forEach((review) => {
				const mockReview = mockReviews.find(
					(r) => r.user.toString() === review.user.toString(),
				);
				assert.ok(mockReview);

				assert.ok(review._id);
				assert.ok(review.createdAt);
				assert.ok(review.updatedAt);
				assert.strictEqual(review.user.toString(), mockReview.user.toString());
				assert.strictEqual(
					review.product.toString(),
					mockReview.product.toString(),
				);
				assert.strictEqual(review.name, mockReview.name);
				assert.strictEqual(review.rating, mockReview.rating);
				assert.strictEqual(review.comment, mockReview.comment);
			});
		});

		test("Should return empty paginated result when 'repo.getAll' is called with no reviews in database", async () => {
			// Act
			const result = await reviewService.getAll({ pageNumber: "1" });

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);

			assert.strictEqual(result.data.meta.totalItems, 0);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);
		});

		test("Should return paginated reviews with correct pagination when 'repo.getAll' is called with pageSize", async () => {
			// Arrange
			const mockReviews = generateMockInsertReviews({ count: 15 });
			await Review.insertMany(mockReviews);

			// Act
			const result = await reviewService.getAll({
				pageNumber: "1",
				pageSize: "5",
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 5);

			assert.strictEqual(result.data.meta.totalItems, 15);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 5);
			assert.strictEqual(result.data.meta.totalPages, 3);
			assert.strictEqual(result.data.meta.hasNextPage, true);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);
		});

		test("Should return second page of reviews when 'repo.getAll' is called with pageNumber 2", async () => {
			// Arrange
			const mockReviews = generateMockInsertReviews({ count: 15 });
			await Review.insertMany(mockReviews);

			// Act
			const result = await reviewService.getAll({
				pageNumber: "2",
				pageSize: "5",
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 5);

			assert.strictEqual(result.data.meta.totalItems, 15);
			assert.strictEqual(result.data.meta.currentPage, 2);
			assert.strictEqual(result.data.meta.pageSize, 5);
			assert.strictEqual(result.data.meta.totalPages, 3);
			assert.strictEqual(result.data.meta.hasNextPage, true);
			assert.strictEqual(result.data.meta.hasPreviousPage, true);
		});

		test("Should return 'ValidationError' when pagination params are invalid", async () => {
			// Act
			const result = await reviewService.getAll({ pageNumber: "invalid" });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAllByUserId", () => {
		test("Should return paginated user reviews when 'repo.getAllByUserId' is called with user having multiple reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({
				count: 3,
				options: { user: userId },
			});
			const otherReviews = generateMockInsertReviews({
				count: 3,
			});
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, mockReviews.length);

			assert.strictEqual(result.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);

			assert.strictEqual(
				result.data.items.every(
					(review) => review.user.toString() === userId.toString(),
				),
				true,
			);
		});

		test("Should return empty paginated result when 'repo.getAllByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);

			assert.strictEqual(result.data.meta.totalItems, 0);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);
		});

		test("Should return paginated user reviews with correct pagination when 'repo.getAllByUserId' is called with pageSize", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({
				count: 8,
				options: { user: userId },
			});
			const otherReviews = generateMockInsertReviews({
				count: 5,
			});
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				pageSize: "3",
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 3);

			assert.strictEqual(result.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 3);
			assert.strictEqual(result.data.meta.totalPages, 3);
			assert.strictEqual(result.data.meta.hasNextPage, true);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);

			assert.strictEqual(
				result.data.items.every(
					(review) => review.user.toString() === userId.toString(),
				),
				true,
			);
		});

		test("Should return 'ValidationError' when 'repo.getAllByUserId' is called with 'userId' being invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when pagination params are invalid", async () => {
			// Arrange
			const userId = generateMockObjectId();

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "invalid",
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAllByProductId", () => {
		test("Should return paginated product reviews when 'repo.getAllByProductId' is called with product having multiple reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			});
			const otherReviews = generateMockInsertReviews({ count: 3 });
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, mockReviews.length);

			assert.strictEqual(result.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);

			assert.strictEqual(
				result.data.items.every(
					(review) => review.product.toString() === productId.toString(),
				),
				true,
			);
		});

		test("Should return empty paginated result when 'repo.getAllByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({ count: 3 });
			await Review.insertMany(mockReviews);

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);

			assert.strictEqual(result.data.meta.totalItems, 0);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);
		});

		test("Should return paginated product reviews with correct pagination when 'repo.getAllByProductId' is called with pageSize", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({
				count: 7,
				options: { product: productId },
			});
			const otherReviews = generateMockInsertReviews({ count: 4 });
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				pageSize: "3",
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 3);

			assert.strictEqual(result.data.meta.totalItems, mockReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 3);
			assert.strictEqual(result.data.meta.totalPages, 3);
			assert.strictEqual(result.data.meta.hasNextPage, true);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);

			result.data.items.every(
				(review) => review.product.toString() === productId.toString(),
				true,
			);
		});

		test("Should return 'ValidationError' when 'repo.getAllByProductId' is called with 'productId' being invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when pagination params are invalid", async () => {
			// Arrange
			const productId = generateMockObjectId();

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "invalid",
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("update", () => {
		test("Should update review when 'repo.update' is called with valid review ID and data", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();
			const createdReview = await Review.create(mockReview);
			const updateData: Partial<InsertReview> = {
				comment: "Updated Comment",
				name: "Updated Name",
			};

			// Act
			const result = await reviewService.update({
				data: updateData,
				reviewId: createdReview._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, updateData.name);
			assert.strictEqual(result.data.comment, updateData.comment);
			assert.strictEqual(result.data.rating, mockReview.rating);
			assert.strictEqual(
				result.data.user.toString(),
				mockReview.user.toString(),
			);
			assert.strictEqual(
				result.data.product.toString(),
				mockReview.product.toString(),
			);
		});

		test("Should update product 'rating' when 'repo.update' is called with new rating value", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			await Product.create(mockProduct);
			const mockReview = generateMockInsertReview({
				product: mockProduct._id,
				rating: 3,
			});
			const createdResult = await reviewService.create(mockReview);
			assert.ok(createdResult.success);

			const updateData = { rating: 5 };
			const updatedMock = { ...mockReview, ...updateData };
			const updatedRating = calculateAvgRating([updatedMock]);

			// Act
			const result = await reviewService.update({
				data: updateData,
				reviewId: createdResult.data._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);

			const updatedProduct = await Product.findById(mockReview.product);
			assert.ok(updatedProduct);
			assert.strictEqual(updatedProduct.numReviews, 1);
			assert.strictEqual(updatedProduct.rating, updatedRating);
		});

		test("Should return 'NotFoundError' when 'repo.update' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();
			const updateData = { name: "Updated Name" };

			// Act
			const result = await reviewService.update({
				data: updateData,
				reviewId: nonExistentId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.update' is called with 'reviewId' being invalid ObjectId", async () => {
			// Arrange
			const updateData = { name: "Updated Name" };
			const reviewId = "invalid-review-id";

			// Act
			const result = await reviewService.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'repo.update' is called with 'rating' being out of range 0-5", async () => {
			// Arrange
			const updateData = { rating: 6 };
			const reviewId = generateMockObjectId().toString();

			// Act
			const result = await reviewService.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("delete", () => {
		test("Should delete review when 'repo.delete' is called with valid review ID", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();
			const createdReview = await Review.create(mockReview);

			// Act
			const result = await reviewService.delete({
				reviewId: createdReview._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockReview.name);
			assert.strictEqual(result.data.rating, mockReview.rating);
			assert.strictEqual(result.data.comment, mockReview.comment);
			assert.deepStrictEqual(result.data.user, mockReview.user);
			assert.deepStrictEqual(result.data.product, mockReview.product);
			const deletedReview = await Review.findById(createdReview._id);
			assert.strictEqual(deletedReview, null);
		});

		test("Should update product 'rating' and 'numReviews' when 'repo.delete' is called with valid review ID", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			await Product.create(mockProduct);
			const mockReview = generateMockInsertReview({
				product: mockProduct._id,
			});
			const createdResult = await reviewService.create(mockReview);
			assert.ok(createdResult.success);

			// Act
			const result = await reviewService.delete({
				reviewId: createdResult.data._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			const updatedProduct = await Product.findById(mockReview.product);
			assert.ok(updatedProduct);
			assert.strictEqual(updatedProduct.rating, 0);
			assert.strictEqual(updatedProduct.numReviews, 0);
		});

		test("Should return 'NotFoundError' when 'repo.delete' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await reviewService.delete({
				reviewId: nonExistentId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.delete' is called with 'reviewId' being invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act
			const result = await reviewService.delete({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("count", () => {
		test("Should return correct count when 'repo.count' is called with multiple reviews in database", async () => {
			// Arrange
			const mockReviews = generateMockInsertReviews({ count: 3 });
			await Review.insertMany(mockReviews);

			// Act
			const result = await reviewService.count();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, mockReviews.length);
		});

		test("Should return 0 when 'repo.count' is called with no reviews in database", async () => {
			// Act
			const result = await reviewService.count();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, 0);
		});
	});

	describe("countByUserId", () => {
		test("Should return correct count when 'repo.countByUserId' is called with user having multiple reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({
				count: 3,
				options: { user: userId },
			});
			const otherReviews = generateMockInsertReviews({ count: 3 });
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const result = await reviewService.countByUserId({
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, mockReviews.length);
		});

		test("Should return 0 when 'repo.countByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({ count: 3 });
			await Review.insertMany(mockReviews);

			// Act
			const result = await reviewService.countByUserId({
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, 0);
		});

		test("Should return 'ValidationError' when 'repo.countByUserId' is called with 'reviewId' being invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act
			const result = await reviewService.countByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("countByProductId", () => {
		test("Should return correct count when 'repo.countByProductId' is called with product having multiple reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			});
			const otherReviews = generateMockInsertReviews({ count: 3 });
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const result = await reviewService.countByProductId({
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, mockReviews.length);
		});

		test("Should return 0 when 'repo.countByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const mockReviews = generateMockInsertReviews({ count: 3 });
			await Review.insertMany(mockReviews);

			// Act
			const result = await reviewService.countByProductId({
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, 0);
		});

		test("Should return 'ValidationError' when 'repo.countByProductId' is called with 'productId' being invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act
			const result = await reviewService.countByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("existsById", () => {
		test("Should return review ID when 'repo.existsById' is called with existing review ID", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();
			const createdReview = await Review.create(mockReview);

			// Act
			const result = await reviewService.existsById({
				reviewId: createdReview._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data._id);
			assert.deepStrictEqual(result.data._id, createdReview._id);
		});

		test("Should return 'NotFoundError' when 'repo.existsById' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await reviewService.existsById({
				reviewId: nonExistentId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.existsById' is called with 'reviewId' being invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act
			const result = await reviewService.existsById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("existsByUserIdAndProductId", () => {
		test("Should return review ID when 'repo.existsByUserIdAndProductId' is called with existing user-product review", async () => {
			// Arrange
			const mockReviews = generateMockInsertReviews({ count: 3 });
			const createdReview = await Review.insertMany(mockReviews);

			// Act
			const result = await reviewService.existsByUserIdAndProductId({
				productId: mockReviews[0].product.toString(),
				userId: mockReviews[0].user.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data._id);
			assert.strictEqual(
				result.data._id.toString(),
				createdReview[0]._id.toString(),
			);
		});

		test("Should return 'NotFoundError' when 'repo.existsByUserIdAndProductId' is called with non-existent user-product review", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const productId = generateMockObjectId();

			// Act
			const result = await reviewService.existsByUserIdAndProductId({
				productId: productId.toString(),
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.existsByUserIdAndProductId' is called with 'userId' being invalid ObjectId", async () => {
			// Arrange
			const productId = generateMockObjectId().toString();
			const userId = "invalid-user-id";

			// Act
			const result = await reviewService.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'repo.existsByUserIdAndProductId' is called with 'productId' being invalid ObjectId", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();
			const productId = "invalid-product-id";

			// Act
			const result = await reviewService.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});
});
