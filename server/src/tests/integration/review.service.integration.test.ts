import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import {
	DatabaseDuplicateKeyError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import { ProductModel } from "../../models/product.model.js";
import { ReviewModel } from "../../models/review.model.js";
import { UserModel } from "../../models/user.model.js";
import { productRepository } from "../../repositories/product.repository.js";
import { reviewRepository } from "../../repositories/review.repository.js";
import { ReviewService } from "../../services/review.service.js";
import type { CreateReview } from "../../types/index.js";
import {
	generateMockInsertProductWithStringImage,
	generateMockInsertReview,
	generateMockInsertReviews,
	generateMockObjectId,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createProduct,
	createReview,
	createReviews,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("Review Service 〖 Integration Tests 〗", () => {
	const reviewService = new ReviewService();

	function calculateAvgRating(reviews: Array<CreateReview>): number {
		const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
		const avg = sum / reviews.length;
		const float = parseFloat(avg.toFixed(1));
		return float;
	}

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(async () => {
		await ReviewModel.deleteMany({});
		await ProductModel.deleteMany({});
		await UserModel.deleteMany({});
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
			assert.strictEqual(result.data.user, mockReview.user);
			assert.strictEqual(result.data.product, mockReview.product);
		});

		test("Should update product 'rating' and 'numReviews' when 'repo.create' is called with valid review data", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);
			const productId = createdProduct.id;

			const mockReview = generateMockInsertReview({ product: productId });

			// Act
			const result = await reviewService.create(mockReview);

			// Assert
			assert.strictEqual(result.success, true);

			const updatedProduct = await productRepository.getById({ productId });
			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);
			assert.strictEqual(updatedProduct.data.rating, mockReview.rating);
			assert.strictEqual(updatedProduct.data.numReviews, 1);
		});

		test("Should update the product 'rating' and 'numReviews' when 'repo.create' is called multiple times with valid review data", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);
			const productId = createdProduct.id;

			const mockReviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			});

			// Act
			const results = await Promise.all(
				mockReviews.map(async (review) => await reviewService.create(review)),
			);

			// Assert
			results.forEach((result) => assert.strictEqual(result.success, true));

			const updatedProduct = await productRepository.getById({ productId });
			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);

			assert.strictEqual(updatedProduct.data.numReviews, mockReviews.length);
			assert.strictEqual(
				updatedProduct.data.rating,
				calculateAvgRating(mockReviews),
			);
		});

		test("Should return 'DatabaseDuplicateKeyError' when 'repo.create' is called with duplicate user-product review", async () => {
			// Arrange
			const mockReview = generateMockInsertReview();

			await createReview(mockReview);

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
			const createdReview = await createReview(generateMockInsertReview());

			// Act
			const result = await reviewService.getById({
				reviewId: createdReview.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, createdReview.name);
			assert.strictEqual(result.data.rating, createdReview.rating);
			assert.strictEqual(result.data.comment, createdReview.comment);
			assert.deepStrictEqual(result.data.user, createdReview.user);
			assert.deepStrictEqual(result.data.product, createdReview.product);
		});

		test("Should return 'NotFoundError' when 'repo.getById' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await reviewService.getById({
				reviewId: nonExistentId,
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
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			// Act
			const result = await reviewService.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, createdReviews.length);

			assert.strictEqual(result.data.meta.totalItems, createdReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);

			result.data.items.forEach((review) => {
				const mockReview = createdReviews.find((r) => r.user === review.user);
				assert.ok(mockReview);

				assert.ok(review.id);
				assert.ok(review.createdAt);
				assert.ok(review.updatedAt);
				assert.strictEqual(review.user, mockReview.user);
				assert.strictEqual(review.product, mockReview.product);
				assert.strictEqual(review.name, mockReview.name);
				assert.strictEqual(review.rating, mockReview.rating);
				assert.strictEqual(review.comment, mockReview.comment);
			});
		});

		test("Should return empty paginated result when 'repo.getAll' is called with no reviews in database", async () => {
			// Act
			const result = await reviewService.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

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
			await createReviews(generateMockInsertReviews({ count: 15 }));

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
			await createReviews(generateMockInsertReviews({ count: 15 }));

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

		test("Should return 'ValidationError' when service arguments are invalid", async () => {
			// Act
			const result = await reviewService.getAll({
				pageNumber: "invalid",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return reviews sorted by rating when 'getAll' is called with valid 'sort'", async () => {
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
			const result = await reviewService.getAll({
				filters: { productId: productId },
				pageNumber: "1",
				pageSize: "10",
				sort: "rating:desc",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.strictEqual(result.data.items.length, 3);

			const resultRatings = result.data.items.map((r) => r.rating);
			assert.deepStrictEqual(resultRatings, expectedSortedRatings);
		});

		test("Should return 'ValidationError' when 'sort' is invalid", async () => {
			// Act
			const result = await reviewService.getAll({
				pageNumber: "1",
				pageSize: "10",
				sort: "invalid",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAllByUserId", () => {
		test("Should return paginated user reviews when 'repo.getAllByUserId' is called with user having multiple reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { user: userId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({
					count: 3,
				}),
			]);

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, targetReviews.length);

			assert.strictEqual(result.data.meta.totalItems, targetReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);

			assert.strictEqual(
				result.data.items.every((review) => review.user === userId),
				true,
			);
		});

		test("Should return empty paginated result when 'repo.getAllByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId: userId,
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
			const targetReviews = generateMockInsertReviews({
				count: 8,
				options: { user: userId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({
					count: 5,
				}),
			]);

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				pageSize: "3",
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 3);

			assert.strictEqual(result.data.meta.totalItems, targetReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 3);
			assert.strictEqual(result.data.meta.totalPages, 3);
			assert.strictEqual(result.data.meta.hasNextPage, true);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);

			assert.strictEqual(
				result.data.items.every((review) => review.user === userId),
				true,
			);
		});

		test("Should return 'ValidationError' when 'repo.getAllByUserId' is called with 'userId' being invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when service arguments are invalid", async () => {
			// Arrange
			const userId = generateMockObjectId();

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "invalid",
				pageSize: "10",
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'sort' is invalid", async () => {
			// Arrange
			const userId = generateMockObjectId();

			// Act
			const result = await reviewService.getAllByUserId({
				pageNumber: "1",
				pageSize: "10",
				sort: "bad-sort",
				userId: userId,
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
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 3 }),
			]);

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				pageSize: "10",
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, targetReviews.length);

			assert.strictEqual(result.data.meta.totalItems, targetReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalPages, 1);

			assert.strictEqual(
				result.data.items.every((review) => review.product === productId),
				true,
			);
		});

		test("Should return empty paginated result when 'repo.getAllByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 3 }));

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				pageSize: "10",
				productId: productId,
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
			const targetReviews = generateMockInsertReviews({
				count: 7,
				options: { product: productId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 4 }),
			]);

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				pageSize: "3",
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 3);

			assert.strictEqual(result.data.meta.totalItems, targetReviews.length);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 3);
			assert.strictEqual(result.data.meta.totalPages, 3);
			assert.strictEqual(result.data.meta.hasNextPage, true);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);

			assert.strictEqual(
				result.data.items.every((review) => review.product === productId),
				true,
			);
		});

		test("Should return 'ValidationError' when 'repo.getAllByProductId' is called with 'productId' being invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				pageSize: "10",
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when service arguments are invalid", async () => {
			// Arrange
			const productId = generateMockObjectId();

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "invalid",
				pageSize: "10",
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'sort' is invalid", async () => {
			// Arrange
			const productId = generateMockObjectId();

			// Act
			const result = await reviewService.getAllByProductId({
				pageNumber: "1",
				pageSize: "10",
				productId: productId,
				sort: "bad-sort",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("update", () => {
		test("Should update review when 'repo.update' is called with valid review ID and data", async () => {
			// Arrange
			const createdReview = await createReview(generateMockInsertReview());

			const updateData: Partial<CreateReview> = {
				comment: "Updated Comment",
				name: "Updated Name",
			};

			// Act
			const result = await reviewService.update({
				data: updateData,
				reviewId: createdReview.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, updateData.name);
			assert.strictEqual(result.data.comment, updateData.comment);
			assert.strictEqual(result.data.rating, createdReview.rating);
			assert.strictEqual(result.data.user, createdReview.user);
			assert.strictEqual(result.data.product, createdReview.product);
		});

		test("Should update product 'rating' when 'repo.update' is called with new rating value", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const createdReview = await reviewService.create(
				generateMockInsertReview({
					product: createdProduct.id,
					rating: 3,
				}),
			);
			assert.ok(createdReview.success);

			const updateData = { rating: 5 };
			const updatedMock = { ...createdReview.data, ...updateData };
			const updatedRating = calculateAvgRating([updatedMock]);

			// Act
			const result = await reviewService.update({
				data: updateData,
				reviewId: createdReview.data.id,
			});

			// Assert
			assert.strictEqual(result.success, true);

			const updatedProduct = await productRepository.getById({
				productId: createdReview.data.product,
			});
			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);
			assert.strictEqual(updatedProduct.data.numReviews, 1);
			assert.strictEqual(updatedProduct.data.rating, updatedRating);
		});

		test("Should return 'NotFoundError' when 'repo.update' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();
			const updateData = { name: "Updated Name" };

			// Act
			const result = await reviewService.update({
				data: updateData,
				reviewId: nonExistentId,
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
			const reviewId = generateMockObjectId();

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
			const createdReview = await createReview(generateMockInsertReview());

			// Act
			const result = await reviewService.delete({
				reviewId: createdReview.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, createdReview.name);
			assert.strictEqual(result.data.rating, createdReview.rating);
			assert.strictEqual(result.data.comment, createdReview.comment);
			assert.deepStrictEqual(result.data.user, createdReview.user);
			assert.deepStrictEqual(result.data.product, createdReview.product);

			const deletedReview = await reviewRepository.getById({
				reviewId: createdReview.id,
			});
			assert.strictEqual(deletedReview.success, true);
			assert.strictEqual(deletedReview.data, null);
		});

		test("Should update product 'rating' and 'numReviews' when 'repo.delete' is called with valid review ID", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const createdReview = await createReview(
				generateMockInsertReview({
					product: createdProduct.id,
				}),
			);

			// Act
			const result = await reviewService.delete({
				reviewId: createdReview.id,
			});

			// Assert
			assert.strictEqual(result.success, true);

			const updatedProduct = await productRepository.getById({
				productId: createdReview.product,
			});
			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);
			assert.strictEqual(updatedProduct.data.rating, 0);
			assert.strictEqual(updatedProduct.data.numReviews, 0);
		});

		test("Should return 'NotFoundError' when 'repo.delete' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await reviewService.delete({
				reviewId: nonExistentId,
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
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);

			// Act
			const result = await reviewService.count();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, createdReviews.length);
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
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { user: userId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 3 }),
			]);

			// Act
			const result = await reviewService.countByUserId({
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, targetReviews.length);
		});

		test("Should return 0 when 'repo.countByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			await createReviews(generateMockInsertReviews({ count: 3 }));

			// Act
			const result = await reviewService.countByUserId({
				userId: userId,
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
			const targetReviews = generateMockInsertReviews({
				count: 3,
				options: { product: productId },
			});

			await createReviews([
				...targetReviews,
				...generateMockInsertReviews({ count: 3 }),
			]);

			// Act
			const result = await reviewService.countByProductId({
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, targetReviews.length);
		});

		test("Should return 0 when 'repo.countByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();

			await createReviews(generateMockInsertReviews({ count: 3 }));

			// Act
			const result = await reviewService.countByProductId({
				productId,
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
			const createdReview = await createReview(generateMockInsertReview());

			// Act
			const result = await reviewService.existsById({
				reviewId: createdReview.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.id);
			assert.strictEqual(result.data.id, createdReview.id);
		});

		test("Should return 'NotFoundError' when 'repo.existsById' is called with non-existent review ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await reviewService.existsById({
				reviewId: nonExistentId,
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
			const createdReviews = await createReviews(
				generateMockInsertReviews({ count: 3 }),
			);
			const targetReview = createdReviews[0];

			// Act
			const result = await reviewService.existsByUserIdAndProductId({
				productId: targetReview.product,
				userId: targetReview.user,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.id);
			assert.strictEqual(result.data.id, targetReview.id);
		});

		test("Should return 'NotFoundError' when 'repo.existsByUserIdAndProductId' is called with non-existent user-product review", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const productId = generateMockObjectId();

			// Act
			const result = await reviewService.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.existsByUserIdAndProductId' is called with 'userId' being invalid ObjectId", async () => {
			// Arrange
			const productId = generateMockObjectId();
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
			const userId = generateMockObjectId();
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
