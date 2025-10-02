import mongoose from "mongoose";
import assert from "node:assert/strict";
import { beforeEach, describe, mock, suite, test } from "node:test";

import type { InsertReview } from "../../types/index.js";

import {
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	DatabaseValidationError,
	GenericDatabaseError,
} from "../../errors/index.js";
import Review from "../../models/review.model.js";
import { ReviewRepository } from "../../repositories/index.js";
import {
	generateMockInsertReview,
	generateMockObjectId,
	generateMockSelectReview,
	generateMockSelectReviews,
} from "../mocks/index.js";

suite("Review Repository 〖 Unit Tests 〗", () => {
	const repo = new ReviewRepository();

	beforeEach(() => mock.reset());

	describe("create", () => {
		const mockReview = generateMockInsertReview();

		test("Should return review object when 'db.create' is called once with review data", async (t) => {
			// Arrange
			const mockCreate = t.mock.method(Review, "create", () => ({
				toObject: () => mockReview,
			}));

			// Act
			const review = await repo.create(mockReview);

			// Assert
			assert.strictEqual(review.success, true);
			assert.deepStrictEqual(review.data, mockReview);

			assert.strictEqual(mockCreate.mock.callCount(), 1);
			assert.deepStrictEqual(mockCreate.mock.calls[0].arguments[0], mockReview);
		});

		test("Should return 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "create", () => {
				throw validationError;
			});

			// Act
			const result = await repo.create(mockReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "create", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.create(mockReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "create", () => {
				throw queryError;
			});

			// Act
			const result = await repo.create(mockReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "create", () => {
				throw networkError;
			});

			// Act
			const result = await repo.create(mockReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "create", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.create(mockReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAll", () => {
		const mockReviews = generateMockSelectReviews({ count: 4 });

		test("Should return array of reviews when 'db.find' is called once with no args", async (t) => {
			// Arrange
			const findMock = t.mock.method(Review, "find", () => ({
				lean: async () => mockReviews,
			}));

			// Act
			const reviews = await repo.getAll();

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data));
			assert.strictEqual(reviews.data.length, mockReviews.length);
			assert.deepStrictEqual(reviews.data, mockReviews);

			assert.strictEqual(findMock.mock.callCount(), 1);
			assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {});
		});

		test("Should return empty array when 'db.find' and returns empty array", async (t) => {
			// Arrange
			t.mock.method(Review, "find", () => ({
				lean: async () => [],
			}));

			// Act
			const reviews = await repo.getAll();

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data));
			assert.strictEqual(reviews.data.length, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "find", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "find", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "find", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "find", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "find", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getById", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;

		test("Should return review object when 'db.findById' is called once with 'reviewId'", async (t) => {
			// Arrange
			const findByIdMock = t.mock.method(Review, "findById", () => ({
				lean: async () => mockReview,
			}));

			// Act
			const review = await repo.getById({ reviewId });

			// Assert
			assert.strictEqual(review.success, true);
			assert.ok(review.data);
			assert.deepStrictEqual(review.data, mockReview);

			assert.strictEqual(findByIdMock.mock.callCount(), 1);
			assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], reviewId);
		});

		test("Should return 'null' when 'db.findById' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Review, "findById", () => ({
				lean: async () => null,
			}));

			// Act
			const review = await repo.getById({ reviewId });

			// Assert
			assert.strictEqual(review.success, true);
			assert.strictEqual(review.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "findById", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "findById", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "findById", () => {
				throw queryError;
			});

			const result = await repo.getById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "findById", () => {
				throw networkError;
			});

			const result = await repo.getById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "findById", () => {
				throw unknownError;
			});

			const result = await repo.getById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAllByUserId", () => {
		const mockReviews = generateMockSelectReviews({ count: 5 });
		const userId = mockReviews[0].user;

		test("Should return array of reviews when 'db.find' is called once with 'userId'", async (t) => {
			// Arrange
			const findByIdMock = t.mock.method(Review, "find", () => ({
				lean: async () => mockReviews,
			}));

			// Act
			const reviews = await repo.getAllByUserId({ userId });

			// Assert
			assert.ok(reviews);
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data));
			assert.strictEqual(reviews.data.length, mockReviews.length);
			assert.deepStrictEqual(reviews.data, mockReviews);

			assert.strictEqual(findByIdMock.mock.callCount(), 1);
			assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], {
				user: userId,
			});
		});

		test("Should return empty array when 'db.find' returns empty array", async (t) => {
			// Arrange
			t.mock.method(Review, "find", () => ({
				lean: async () => [],
			}));

			// Act
			const reviews = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data));
			assert.strictEqual(reviews.data.length, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "find", () => {
				throw validationError;
			});

			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "find", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "find", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "find", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "find", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAllByProductId", () => {
		const mockReviews = generateMockSelectReviews({ count: 5 });
		const productId = mockReviews[0].product;

		test("Should return array of reviews when 'db.find' is called once with 'productId'", async (t) => {
			// Arrange
			const findByIdMock = t.mock.method(Review, "find", () => ({
				lean: async () => mockReviews,
			}));

			// Act
			const reviews = await repo.getAllByProductId({ productId });

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data));
			assert.strictEqual(reviews.data.length, mockReviews.length);
			assert.deepStrictEqual(reviews.data, mockReviews);

			assert.strictEqual(findByIdMock.mock.callCount(), 1);
			assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], {
				product: productId,
			});
		});

		test("Should return empty array when 'db.find' returns empty array", async (t) => {
			// Arrange
			t.mock.method(Review, "find", () => ({
				lean: async () => [],
			}));

			// Act
			const reviews = await repo.getAllByProductId({ productId });

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data));
			assert.strictEqual(reviews.data.length, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "find", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAllByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "find", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "find", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "find", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "find", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("update", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;
		const updateData: Partial<InsertReview> = { comment: "new-comment" };
		const expectedResult = { ...mockReview, ...updateData };

		test("Should return review object when 'db.findByIdAndUpdate' is called once with 'reviewId' and 'updateData'", async (t) => {
			// Arrange
			const findByIdAndUpdateMock = t.mock.method(
				Review,
				"findByIdAndUpdate",
				() => ({
					lean: async () => expectedResult,
				}),
			);

			// Act
			const updatedReview = await repo.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(updatedReview.success, true);
			assert.ok(updatedReview.data);
			assert.deepStrictEqual(updatedReview.data, expectedResult);

			assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				findByIdAndUpdateMock.mock.calls[0].arguments[0],
				reviewId,
			);
			assert.deepStrictEqual(
				findByIdAndUpdateMock.mock.calls[0].arguments[1],
				updateData,
			);
		});

		test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Review, "findByIdAndUpdate", () => ({
				lean: async () => null,
			}));

			// Act
			const updatedReview = await repo.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(updatedReview.success, true);
			assert.strictEqual(updatedReview.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "findByIdAndUpdate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "findByIdAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "findByIdAndUpdate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "findByIdAndUpdate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "findByIdAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.update({ data: updateData, reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("delete", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;

		test("Should return review object when 'db.findByIdAndDelete' is called once with'reviewId'", async (t) => {
			// Arrange
			const findByIdAndDeleteMock = t.mock.method(
				Review,
				"findByIdAndDelete",
				() => ({
					lean: async () => mockReview,
				}),
			);

			// Act
			const deletedReview = await repo.delete({ reviewId });

			// Assert
			assert.strictEqual(deletedReview.success, true);
			assert.ok(deletedReview.data);
			assert.deepStrictEqual(deletedReview.data, mockReview);

			assert.strictEqual(findByIdAndDeleteMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				findByIdAndDeleteMock.mock.calls[0].arguments[0],
				reviewId,
			);
		});

		test("Should return 'null' when 'db.findByIdAndDelete' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Review, "findByIdAndDelete", () => ({
				lean: async () => null,
			}));

			// Act
			const deletedReview = await repo.delete({ reviewId });

			// Assert
			assert.strictEqual(deletedReview.success, true);
			assert.strictEqual(deletedReview.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndDelete' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "findByIdAndDelete", () => {
				throw validationError;
			});

			// Act
			const result = await repo.delete({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndDelete' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "findByIdAndDelete", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.delete({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndDelete' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "findByIdAndDelete", () => {
				throw queryError;
			});

			// Act
			const result = await repo.delete({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndDelete' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "findByIdAndDelete", () => {
				throw networkError;
			});

			// Act
			const result = await repo.delete({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndDelete' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "findByIdAndDelete", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.delete({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("count", () => {
		const mockCount = 5;

		test("Should return the count as number when 'db.countDocuments' is called once with no args", async (t) => {
			// Arrange
			const countDocumentsMock = t.mock.method(
				Review,
				"countDocuments",
				() => ({
					lean: async () => mockCount,
				}),
			);

			// Act
			const count = await repo.count();

			// Assert
			assert.ok(count.success);
			assert.ok(typeof count.data === "number");
			assert.strictEqual(count.data, mockCount);

			assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				countDocumentsMock.mock.calls[0].arguments.length,
				0,
			);
		});

		test("Should return '0' when 'db.countDocuments' returns '0'", async (t) => {
			// Arrange
			t.mock.method(Review, "countDocuments", () => ({
				lean: async () => 0,
			}));

			// Act
			const count = await repo.count();

			// Assert
			assert.strictEqual(count.success, true);
			assert.strictEqual(count.data, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "countDocuments", () => {
				throw validationError;
			});

			// Act
			const result = await repo.count();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "countDocuments", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.count();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "countDocuments", () => {
				throw queryError;
			});

			// Act
			const result = await repo.count();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "countDocuments", () => {
				throw networkError;
			});

			// Act
			const result = await repo.count();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "countDocuments", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.count();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("countByUserId", () => {
		const mockCount = 5;
		const userId = generateMockObjectId();

		test("Should return the count as number when 'db.countDocuments' is called once with 'userId' ", async (t) => {
			// Arrange
			const countDocumentsMock = t.mock.method(
				Review,
				"countDocuments",
				() => ({
					lean: async () => mockCount,
				}),
			);

			// Act
			const count = await repo.countByUserId({ userId });

			assert.ok(count.success);
			assert.ok(typeof count.data === "number");
			assert.strictEqual(count.data, mockCount);

			assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
			assert.deepStrictEqual(countDocumentsMock.mock.calls[0].arguments[0], {
				user: userId,
			});
		});

		test("Should return '0' when 'db.countDocuments' returns '0'", async (t) => {
			// Arrange
			t.mock.method(Review, "countDocuments", () => ({
				lean: async () => 0,
			}));

			// Act
			const count = await repo.countByUserId({ userId });

			// Assert
			assert.strictEqual(count.success, true);
			assert.strictEqual(count.data, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "countDocuments", () => {
				throw validationError;
			});

			// Act
			const result = await repo.countByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "countDocuments", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.countByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "countDocuments", () => {
				throw queryError;
			});

			// Act
			const result = await repo.countByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "countDocuments", () => {
				throw networkError;
			});

			// Act
			const result = await repo.countByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "countDocuments", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.countByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("countByProductId", () => {
		const mockCount = 5;
		const productId = generateMockObjectId();

		test("Should return the count as number when 'db.countDocuments' is called once with 'productId'", async (t) => {
			// Arrange
			const countDocumentsMock = t.mock.method(
				Review,
				"countDocuments",
				() => ({
					lean: async () => mockCount,
				}),
			);

			// Act
			const count = await repo.countByProductId({ productId });

			// Assert
			assert.ok(count.success);
			assert.ok(typeof count.data === "number");
			assert.strictEqual(count.data, mockCount);

			assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
			assert.deepStrictEqual(countDocumentsMock.mock.calls[0].arguments[0], {
				product: productId,
			});
		});

		test("Should return '0' when 'db.countDocuments' returns '0'", async (t) => {
			// Arrange
			t.mock.method(Review, "countDocuments", () => ({
				lean: async () => 0,
			}));

			// Act
			const count = await repo.countByProductId({ productId });

			// Assert
			assert.strictEqual(count.success, true);
			assert.strictEqual(count.data, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "countDocuments", () => {
				throw validationError;
			});

			// Act
			const result = await repo.countByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "countDocuments", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.countByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "countDocuments", () => {
				throw queryError;
			});

			// Act
			const result = await repo.countByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "countDocuments", () => {
				throw networkError;
			});

			// Act
			const result = await repo.countByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "countDocuments", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.countByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("existsById", () => {
		const reviewId = generateMockObjectId();
		const expectedResult = { _id: reviewId };

		test("Should return the 'reviewId' when 'db.exists' is called once with 'reviewId'", async (t) => {
			// Arrange
			const existsMock = t.mock.method(Review, "exists", () => ({
				lean: async () => expectedResult,
			}));

			// Act
			const reviewExists = await repo.existsById({ reviewId });

			// Assert
			assert.ok(reviewExists.success);
			assert.ok(reviewExists.data);
			assert.deepStrictEqual(reviewExists.data, expectedResult);

			assert.strictEqual(existsMock.mock.callCount(), 1);
			assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], {
				_id: reviewId,
			});
		});

		test("Should return 'null' when 'db.exists' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Review, "exists", () => ({
				lean: async () => null,
			}));

			// Act
			const reviewExists = await repo.existsById({ reviewId });

			// Assert
			assert.strictEqual(reviewExists.success, true);
			assert.strictEqual(reviewExists.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.exists' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "exists", () => {
				throw validationError;
			});

			// Act
			const result = await repo.existsById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.exists' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "exists", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.existsById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.exists' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "exists", () => {
				throw queryError;
			});

			// Act
			const result = await repo.existsById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.exists' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "exists", () => {
				throw networkError;
			});

			// Act
			const result = await repo.existsById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.exists' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "exists", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.existsById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("existsByUserIdAndProductId", () => {
		const userId = generateMockObjectId();
		const productId = generateMockObjectId();
		const reviewId = generateMockObjectId();
		const expectedResult = { _id: reviewId };

		test("Should return 'reviewId' when 'db.exists' is called once with 'userId' and 'productId'", async (t) => {
			// Arrange
			const existsMock = t.mock.method(Review, "exists", () => ({
				lean: async () => expectedResult,
			}));

			// Act
			const reviewExists = await repo.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.ok(reviewExists.success);
			assert.ok(reviewExists.data);
			assert.deepStrictEqual(reviewExists.data, expectedResult);

			assert.strictEqual(existsMock.mock.callCount(), 1);
			assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], {
				product: productId,
				user: userId,
			});
		});

		test("Should return 'null' when 'db.exists' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Review, "exists", () => ({
				lean: async () => null,
			}));

			// Act
			const reviewExists = await repo.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(reviewExists.success, true);
			assert.strictEqual(reviewExists.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.exists' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Review, "exists", () => {
				throw validationError;
			});

			// Act
			const result = await repo.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.exists' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Review, "exists", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.exists' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Review, "exists", () => {
				throw queryError;
			});

			// Act
			const result = await repo.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.exists' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Review, "exists", () => {
				throw networkError;
			});

			// Act
			const result = await repo.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.exists' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Review, "exists", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});
});
