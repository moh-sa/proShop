import type { Types } from "mongoose";

import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import type { InsertReview } from "../../types/index.js";

import {
	DatabaseDuplicateKeyError,
	DatabaseValidationError,
} from "../../errors/index.js";
import Product from "../../models/product.model.js";
import Review from "../../models/review.model.js";
import { ReviewRepository } from "../../repositories/index.js";
import {
	generateMockObjectId,
	generateMockSelectProduct,
} from "../mocks/index.js";
import {
	generateMockInsertReview,
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
		await Review.deleteMany({});
		await Product.deleteMany({});
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
			assert.equal(createdReview.data.name, mockReview.name);
			assert.equal(createdReview.data.rating, mockReview.rating);
			assert.equal(createdReview.data.comment, mockReview.comment);
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
			assert.equal(retrievedReview.data.name, mockReview.name);
			assert.equal(retrievedReview.data.rating, mockReview.rating);
			assert.equal(retrievedReview.data.comment, mockReview.comment);
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
		test("should return empty array when 'getAll' is called with no reviews in database", async () => {
			// Act
			const reviews = await reviewRepository.getAll();

			// Assert
			assert.ok(reviews.success);
			assert.deepStrictEqual(reviews.data, []);
		});

		test("should return all reviews when 'getAll' is called with multiple reviews in database", async () => {
			// Arrange
			const mockReviews = generateMockSelectReviews({ count: 3 });
			await Review.insertMany(mockReviews);

			// Act
			const reviews = await reviewRepository.getAll();

			// Assert
			assert.ok(reviews.success);
			assert.ok(Array.isArray(reviews.data));
			assert.equal(reviews.data.length, mockReviews.length);

			reviews.data.forEach((review) => {
				const mockReview = mockReviews.find(
					(mr) => mr._id.toString() === review._id.toString(),
				);
				assert.ok(
					mockReview,
					"Each returned review should match a mock review",
				);
			});
		});
	});

	describe("getAllByUserId", () => {
		test("should return user's reviews when 'getAllByUserId' is called with valid user ID", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockReviews = generateMockSelectReviews({
				count: 3,
				options: { user: userId },
			});
			const otherReviews = generateMockSelectReviews({ count: 2 });
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const reviews = await reviewRepository.getAllByUserId({ userId });

			// Assert
			assert.ok(reviews.success);
			assert.ok(Array.isArray(reviews.data));
			assert.equal(reviews.data.length, mockReviews.length);

			reviews.data.forEach((review) => {
				assert.deepStrictEqual(
					review.user,
					userId,
					"Each review should belong to the specified user",
				);
			});
		});

		test("should return empty array when 'getAllByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const mockReviews = generateMockSelectReviews({ count: 2 });
			await Review.insertMany(mockReviews);

			// Act
			const reviews = await reviewRepository.getAllByUserId({ userId });

			// Assert
			assert.ok(reviews.success);
			assert.ok(Array.isArray(reviews.data));
			assert.deepStrictEqual(reviews.data, []);
		});

		test("should throw 'DatabaseValidationError' when 'getAllByUserId' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

			// Act
			const result = await reviewRepository.getAllByUserId({
				userId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("getAllByProductId", () => {
		test("should return product's reviews when 'getAllByProductId' is called with valid product ID", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const mockReviews = generateMockSelectReviews({
				count: 3,
				options: { product: productId },
			});
			const otherReviews = generateMockSelectReviews({ count: 2 });
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const reviews = await reviewRepository.getAllByProductId({ productId });

			// Assert
			assert.ok(reviews.success);
			assert.ok(Array.isArray(reviews.data));
			assert.equal(reviews.data.length, mockReviews.length);
			reviews.data.forEach((review) => {
				assert.deepStrictEqual(
					review.product,
					productId,
					"Each review should belong to the specified product",
				);
			});
		});

		test("should return empty array when 'getAllByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			const mockReviews = generateMockSelectReviews({ count: 2 });
			await Review.insertMany(mockReviews);

			// Act
			const reviews = await reviewRepository.getAllByProductId({ productId });

			// Assert
			assert.ok(reviews.success);
			assert.ok(Array.isArray(reviews.data));
			assert.deepStrictEqual(reviews.data, []);
		});

		test("should throw 'DatabaseValidationError' when 'getAllByProductId' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

			// Act
			const result = await reviewRepository.getAllByProductId({
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
			assert.equal(updatedReview.data.rating, updateData.rating);
			assert.equal(updatedReview.data.comment, updateData.comment);

			// Verify other fields remain unchanged
			assert.equal(updatedReview.data.name, mockReview.name);
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
			assert.equal(deletedReview.data.name, mockReview.name);
			assert.equal(deletedReview.data.rating, mockReview.rating);
			assert.equal(deletedReview.data.comment, mockReview.comment);
			assert.deepStrictEqual(deletedReview.data.user, mockReview.user);
			assert.deepStrictEqual(deletedReview.data.product, mockReview.product);

			// Verify review is actually deleted
			const reviewInDb = await Review.findById(createdReview.data._id).lean();
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
			await Review.insertMany(mockReviews);

			// Act
			const count = await reviewRepository.count();

			// Assert
			assert.ok(count.success);
			assert.equal(count.data, mockReviews.length);
		});

		test("should return zero when 'count' is called with empty database", async () => {
			// Act
			const count = await reviewRepository.count();

			// Assert
			assert.ok(count.success);
			assert.equal(count.data, 0);
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
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const count = await reviewRepository.countByUserId({ userId });

			// Assert
			assert.ok(count.success);
			assert.equal(count.data, mockReviews.length);
		});

		test("should return zero when 'countByUserId' is called with user having no reviews", async () => {
			// Arrange
			const userId = generateMockObjectId();
			// Add some reviews by other users
			await Review.insertMany(generateMockSelectReviews({ count: 2 }));

			// Act
			const count = await reviewRepository.countByUserId({ userId });

			// Assert
			assert.ok(count.success);
			assert.equal(count.data, 0);
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
			await Review.insertMany([...mockReviews, ...otherReviews]);

			// Act
			const count = await reviewRepository.countByProductId({ productId });

			// Assert
			assert.ok(count.success);
			assert.equal(count.data, mockReviews.length);
		});

		test("should return zero when 'countByProductId' is called with product having no reviews", async () => {
			// Arrange
			const productId = generateMockObjectId();
			// Add some reviews for other products
			await Review.insertMany(generateMockSelectReviews({ count: 2 }));

			// Act
			const count = await reviewRepository.countByProductId({ productId });

			// Assert
			assert.ok(count.success);
			assert.equal(count.data, 0);
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
			await Product.create(mockProduct);

			// Act
			await reviewRepository.create(mockReview);

			// Assert
			const updatedProduct = await Product.findById(productId).lean();
			assert.ok(updatedProduct);
			assert.equal(updatedProduct.rating, 4.0);
			assert.equal(updatedProduct.numReviews, 1);
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
			await Product.create(mockProduct);
			await reviewRepository.create(mockReview);

			// Act
			await reviewRepository.update({
				data: updateData,
				reviewId: mockReview._id,
			});

			// Assert
			const updatedProduct = await Product.findById(productId).lean();

			assert.ok(updatedProduct);
			assert.equal(updatedProduct.rating, updateData.rating);
			assert.equal(updatedProduct.numReviews, 1);
		});

		test("should update product rating and numReviews when review is deleted", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id;
			const mockReview = generateMockSelectReview({
				product: productId,
				rating: 4,
			});
			await Product.create(mockProduct);
			await Review.create(mockReview);

			// Act
			await reviewRepository.delete({ reviewId: mockReview._id });

			// Assert
			const updatedProduct = await Product.findById(productId).lean();

			assert.ok(updatedProduct);
			assert.equal(updatedProduct.rating, 0);
			assert.equal(updatedProduct.numReviews, 0);
		});
	});
});
