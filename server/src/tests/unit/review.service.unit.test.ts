import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import type { InsertReview } from "../../types/index.js";

import { NotFoundError, ValidationError } from "../../errors/index.js";
import { ReviewService } from "../../services/index.js";
import {
	generateMockInsertReview,
	generateMockObjectId,
	generateMockSelectReview,
	generateMockSelectReviews,
	mockReviewRepository,
} from "../mocks/index.js";

suite("Review Service 〖 Unit Tests 〗", () => {
	const mockRepo = mockReviewRepository();
	const service = new ReviewService(mockRepo);

	beforeEach(() => mockRepo.reset());

	describe("Create", () => {
		test("Should return 'review object' when 'repo.create' is called once with 'review data'", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview();
			const mockSelectReview = generateMockSelectReview(mockInsertReview);

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectReview, success: true }),
			);

			// Act
			const review = await service.create(mockInsertReview);

			// Assert
			assert.ok(review);
			assert.deepStrictEqual(review, mockSelectReview);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockInsertReview,
			);
		});

		test("Should throw 'ValidationError' if 'review.user' is invalid objectId", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				// @ts-expect-error - test case
				user: "invalid-user-id",
			});

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertReview),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'review.product' is invalid objectId", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				// @ts-expect-error - test case
				product: "invalid-product-id",
			});

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertReview),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'review.rating' is less than 0", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				rating: -1,
			});

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertReview),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'review.rating' is greater than 5", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				rating: 6,
			});

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertReview),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'review.rating' is not a number", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				// @ts-expect-error - test case
				rating: "invalid-rating",
			});

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertReview),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'review.comment' is empty string", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				comment: "",
			});

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertReview),
				ValidationError,
			);
		});
	});

	describe("getAll", () => {
		const mockReviews = generateMockSelectReviews({ count: 4 });

		test("Should return 'array of reviews' when 'repo.getAll' is called once with no arguments", async () => {
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			const reviews = await service.getAll();

			assert.ok(reviews);
			assert.deepStrictEqual(reviews, mockReviews);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should return 'empty array' when 'repo.getAll' return 'empty array'", async () => {
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			const reviews = await service.getAll();

			assert.strictEqual(reviews.length, 0);
		});
	});

	describe("getAllByUserId", () => {
		const mockReviews = generateMockSelectReviews({ count: 4 });
		const userId = mockReviews[0].user;

		test("Should return 'array of reviews' when 'repo.getAllByUserId' is called once with 'userId'", async () => {
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			const reviews = await service.getAllByUserId({
				userId: userId.toString(),
			});

			assert.ok(reviews);
			assert.deepStrictEqual(reviews, mockReviews);

			assert.strictEqual(mockRepo.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getAllByUserId.mock.calls[0].arguments[0],
				{ userId },
			);
		});

		test("Should return 'empty array' when 'repo.getAllByUserId' return 'empty array'", async () => {
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			const reviews = await service.getAllByUserId({
				userId: userId.toString(),
			});

			assert.strictEqual(reviews.length, 0);
		});

		test("Should throw 'ValidationError' if 'userId' is invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.getAllByUserId({ userId }),
				ValidationError,
			);
		});
	});

	describe("getAllByProductId", () => {
		const mockReviews = generateMockSelectReviews({ count: 5 });
		const productId = mockReviews[0].product;

		test("Should return 'array of reviews' when'repo.getAllByProductId' is called once with 'productId'", async () => {
			mockRepo.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			const reviews = await service.getAllByProductId({
				productId: productId.toString(),
			});

			assert.ok(reviews);
			assert.deepEqual(reviews, mockReviews);

			assert.strictEqual(mockRepo.getAllByProductId.mock.callCount(), 1);
			assert.deepEqual(mockRepo.getAllByProductId.mock.calls[0].arguments[0], {
				productId,
			});
		});

		test("Should return empty array if no reviews exist", async () => {
			mockRepo.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			const reviews = await service.getAllByProductId({
				productId: productId.toString(),
			});

			assert.strictEqual(reviews.length, 0);
		});

		test("Should throw 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.getAllByProductId({ productId }),
				ValidationError,
			);
		});
	});

	describe("getById", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;

		test("Should return 'review object' when 'repo.getById' is called once with 'reviewId'", async () => {
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			const review = await service.getById({ reviewId: reviewId.toString() });

			assert.ok(review);
			assert.deepStrictEqual(review, mockReview);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
				reviewId,
			});
		});

		test("Should throw 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () => await service.getById({ reviewId: reviewId.toString() }),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'reviewId' is invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.getById({ reviewId }),
				ValidationError,
			);
		});
	});

	describe("update", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;
		const updateData: Partial<InsertReview> = { comment: "new-comment" };
		const expectedResult = { ...mockReview, ...updateData };

		test("Should return 'review object' when 'repo.update' is called once with 'reviewId' and 'updateData'", async () => {
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			const updatedReview = await service.update({
				data: updateData,
				reviewId: reviewId.toString(),
			});

			assert.ok(updatedReview);
			assert.deepEqual(updatedReview, expectedResult);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
			assert.deepEqual(mockRepo.update.mock.calls[0].arguments[0], {
				data: updateData,
				reviewId,
			});
		});

		test("Should throw 'NotFoundError' when 'repo.update' returns 'null'", async () => {
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () =>
					await service.update({
						data: updateData,
						reviewId: reviewId.toString(),
					}),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'reviewId' is invalid ObjectId", async () => {
			// Arrange
			const updateData = { comment: "new-comment" };
			const reviewId = "invalid-review-id";

			// Act & Assert
			await assert.rejects(
				async () =>
					await service.update({
						data: updateData,
						reviewId,
					}),
				ValidationError,
			);
		});
	});

	describe("delete", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;

		test("Should return 'review object' when 'repo.delete' is called once with 'reviewId'", async () => {
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			const deletedReview = await service.delete({
				reviewId: reviewId.toString(),
			});

			assert.ok(deletedReview);
			assert.deepEqual(deletedReview, mockReview);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
			assert.deepEqual(mockRepo.delete.mock.calls[0].arguments[0], {
				reviewId,
			});
		});

		test("Should throw 'NotFoundError' when 'repo.delete' returns 'null'", async () => {
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () => await service.delete({ reviewId: reviewId.toString() }),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'reviewId' is invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.delete({ reviewId }),
				ValidationError,
			);
		});
	});

	describe("countByUserId", () => {
		const mockCount = 10;
		const userId = generateMockObjectId();

		test("Should return the count as number when 'repo.countByUserId' is called once with 'userId'", async () => {
			mockRepo.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			const count = await service.countByUserId({ userId: userId.toString() });

			assert.ok(count);
			assert.ok(typeof count === "number");
			assert.strictEqual(count, mockCount);

			assert.strictEqual(mockRepo.countByUserId.mock.callCount(), 1);
			assert.deepEqual(mockRepo.countByUserId.mock.calls[0].arguments[0], {
				userId,
			});
		});

		test("Should return '0' when 'repo.countByUserId' returns '0'", async () => {
			mockRepo.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: 0, success: true }),
			);

			const count = await service.countByUserId({ userId: userId.toString() });

			assert.strictEqual(count, 0);
		});

		test("Should throw 'ValidationError' if 'userId' is invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.countByUserId({ userId }),
				ValidationError,
			);
		});
	});

	describe("countByProductId", () => {
		const mockCount = 10;
		const productId = generateMockObjectId();

		test("Should return the count as number when 'repo.countByProductId' is called once with 'productId'", async () => {
			mockRepo.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			const count = await service.countByProductId({
				productId: productId.toString(),
			});

			assert.ok(count);
			assert.ok(typeof count === "number");
			assert.strictEqual(count, mockCount);

			assert.strictEqual(mockRepo.countByProductId.mock.callCount(), 1);
			assert.deepEqual(mockRepo.countByProductId.mock.calls[0].arguments[0], {
				productId,
			});
		});

		test("Should return '0' when 'repo.countByProductId' returns '0'", async () => {
			mockRepo.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: 0, success: true }),
			);

			const count = await service.countByProductId({
				productId: productId.toString(),
			});

			assert.strictEqual(count, 0);
		});

		test("Should throw 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.countByProductId({ productId }),
				ValidationError,
			);
		});
	});

	describe("existsById", () => {
		const reviewId = generateMockObjectId();
		const expectedResult = { _id: reviewId };

		test("Should return 'reviewId' when 'repo.existsById' is called once with 'reviewId'", async () => {
			mockRepo.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			const count = await service.existsById({ reviewId: reviewId.toString() });

			assert.ok(count);
			assert.deepEqual(count, expectedResult);

			assert.strictEqual(mockRepo.existsById.mock.callCount(), 1);
			assert.deepEqual(mockRepo.existsById.mock.calls[0].arguments[0], {
				reviewId,
			});
		});

		test("Should throw 'NotFoundError' when 'repo.existsById' returns 'null'", async () => {
			mockRepo.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () => await service.existsById({ reviewId: reviewId.toString() }),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'reviewId' is invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.existsById({ reviewId }),
				ValidationError,
			);
		});
	});

	describe("existsByUserIdAndProductId", () => {
		const userId = generateMockObjectId();
		const productId = generateMockObjectId();
		const reviewId = generateMockObjectId();
		const existsResult = { _id: reviewId };

		test("Should return 'reviewId' when'repo.existsByUserIdAndProductId' is called once with 'userId' and 'productId'", async () => {
			mockRepo.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: existsResult, success: true }),
			);

			const count = await service.existsByUserIdAndProductId({
				productId: productId.toString(),
				userId: userId.toString(),
			});

			assert.ok(count);
			assert.deepEqual(count, existsResult);

			assert.strictEqual(
				mockRepo.existsByUserIdAndProductId.mock.callCount(),
				1,
			);
			assert.deepEqual(
				mockRepo.existsByUserIdAndProductId.mock.calls[0].arguments[0],
				{
					productId,
					userId,
				},
			);
		});

		test("Should throw 'NotFoundError' when 'repo.existsByUserIdAndProductId' returns 'null'", async () => {
			mockRepo.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () =>
					await service.existsByUserIdAndProductId({
						productId: productId.toString(),
						userId: userId.toString(),
					}),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Review not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'userId' is invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";
			const productId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(
				async () =>
					await service.existsByUserIdAndProductId({
						productId,
						userId,
					}),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";
			const userId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(
				async () =>
					await service.existsByUserIdAndProductId({
						productId,
						userId,
					}),
				ValidationError,
			);
		});
	});
});
