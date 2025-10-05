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
			const result = await service.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockSelectReview);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockInsertReview,
			);
		});

		test("Should return 'ValidationError' if 'review.user' is invalid objectId", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				// @ts-expect-error - test case
				user: "invalid-user-id",
			});

			// Act
			const result = await service.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if 'review.product' is invalid objectId", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				// @ts-expect-error - test case
				product: "invalid-product-id",
			});

			// Act
			const result = await service.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if 'review.rating' is less than 0", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				rating: -1,
			});

			// Act
			const result = await service.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if 'review.rating' is greater than 5", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				rating: 6,
			});

			// Act
			const result = await service.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if 'review.rating' is not a number", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				// @ts-expect-error - test case
				rating: "invalid-rating",
			});

			// Act
			const result = await service.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if 'review.comment' is empty string", async () => {
			// Arrange
			const mockInsertReview = generateMockInsertReview({
				comment: "",
			});

			// Act
			const result = await service.create(mockInsertReview);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAll", () => {
		const mockReviews = generateMockSelectReviews({ count: 4 });

		test("Should return 'array of reviews' when 'repo.getAll' is called once with no arguments", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			const result = await service.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockReviews);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should return 'empty array' when 'repo.getAll' return 'empty array'", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			// Act
			const result = await service.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 0);
		});
	});

	describe("getAllByUserId", () => {
		const mockReviews = generateMockSelectReviews({ count: 4 });
		const userId = mockReviews[0].user;

		test("Should return 'array of reviews' when 'repo.getAllByUserId' is called once with 'userId'", async () => {
			// Arrange
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			const result = await service.getAllByUserId({
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockReviews);

			assert.strictEqual(mockRepo.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getAllByUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should return 'empty array' when 'repo.getAllByUserId' return 'empty array'", async () => {
			// Arrange
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			// Act
			const result = await service.getAllByUserId({
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 0);
		});

		test("Should return 'ValidationError' if 'userId' is invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act
			const result = await service.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAllByProductId", () => {
		const mockReviews = generateMockSelectReviews({ count: 5 });
		const productId = mockReviews[0].product;

		test("Should return 'array of reviews' when'repo.getAllByProductId' is called once with 'productId'", async () => {
			// Arrange
			mockRepo.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			const result = await service.getAllByProductId({
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, mockReviews);

			assert.strictEqual(mockRepo.getAllByProductId.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.getAllByProductId.mock.calls[0].arguments[0].productId,
				productId,
			);
		});

		test("Should return empty array if no reviews exist", async () => {
			// Arrange
			mockRepo.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: [], success: true }),
			);

			// Act
			const result = await service.getAllByProductId({
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 0);
		});

		test("Should return 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act
			const result = await service.getAllByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getById", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;

		test("Should return 'review object' when 'repo.getById' is called once with 'reviewId'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			const result = await service.getById({ reviewId: reviewId.toString() });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockReview);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getById.mock.calls[0].arguments[0].reviewId,
				reviewId,
			);
		});

		test("Should return 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.getById({ reviewId: reviewId.toString() });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'reviewId' is invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act
			const result = await service.getById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("update", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;
		const updateData: Partial<InsertReview> = { comment: "new-comment" };
		const expectedResult = { ...mockReview, ...updateData };

		test("Should return 'review object' when 'repo.update' is called once with 'reviewId' and 'updateData'", async () => {
			// Arrange
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.update({
				data: updateData,
				reviewId: reviewId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.update.mock.calls[0].arguments[0].reviewId,
				reviewId,
			);
			assert.deepEqual(
				mockRepo.update.mock.calls[0].arguments[0].data,
				updateData,
			);
		});

		test("Should return 'NotFoundError' when 'repo.update' returns 'null'", async () => {
			// Arrange
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.update({
				data: updateData,
				reviewId: reviewId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'reviewId' is invalid ObjectId", async () => {
			// Arrange
			const updateData = { comment: "new-comment" };
			const reviewId = "invalid-review-id";

			// Act
			const result = await service.update({
				data: updateData,
				reviewId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("delete", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;

		test("Should return 'review object' when 'repo.delete' is called once with 'reviewId'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			const result = await service.delete({
				reviewId: reviewId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, mockReview);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.delete.mock.calls[0].arguments[0].reviewId,
				reviewId,
			);
		});

		test("Should return 'NotFoundError' when 'repo.delete' returns 'null'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.delete({ reviewId: reviewId.toString() });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'reviewId' is invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act
			const result = await service.delete({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("countByUserId", () => {
		const mockCount = 10;
		const userId = generateMockObjectId();

		test("Should return the count as number when 'repo.countByUserId' is called once with 'userId'", async () => {
			// Arrange
			mockRepo.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			const result = await service.countByUserId({ userId: userId.toString() });

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(typeof result.data === "number");
			assert.strictEqual(result.data, mockCount);

			assert.strictEqual(mockRepo.countByUserId.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.countByUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should return '0' when 'repo.countByUserId' returns '0'", async () => {
			// Arrange
			mockRepo.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: 0, success: true }),
			);

			// Act
			const result = await service.countByUserId({ userId: userId.toString() });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, 0);
		});

		test("Should return 'ValidationError' if 'userId' is invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act
			const result = await service.countByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("countByProductId", () => {
		const mockCount = 10;
		const productId = generateMockObjectId();

		test("Should return the count as number when 'repo.countByProductId' is called once with 'productId'", async () => {
			// Arrange
			mockRepo.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			const result = await service.countByProductId({
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(typeof result.data === "number");
			assert.strictEqual(result.data, mockCount);

			assert.strictEqual(mockRepo.countByProductId.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.countByProductId.mock.calls[0].arguments[0].productId,
				productId,
			);
		});

		test("Should return '0' when 'repo.countByProductId' returns '0'", async () => {
			// Arrange
			mockRepo.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: 0, success: true }),
			);

			// Act
			const result = await service.countByProductId({
				productId: productId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, 0);
		});

		test("Should return 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act
			const result = await service.countByProductId({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("existsById", () => {
		const reviewId = generateMockObjectId();
		const expectedResult = { _id: reviewId };

		test("Should return 'reviewId' when 'repo.existsById' is called once with 'reviewId'", async () => {
			// Arrange
			mockRepo.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.existsById({
				reviewId: reviewId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.existsById.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.existsById.mock.calls[0].arguments[0].reviewId,
				reviewId,
			);
		});

		test("Should return 'NotFoundError' when 'repo.existsById' returns 'null'", async () => {
			// Arrange
			mockRepo.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.existsById({
				reviewId: reviewId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'reviewId' is invalid ObjectId", async () => {
			// Arrange
			const reviewId = "invalid-review-id";

			// Act
			const result = await service.existsById({ reviewId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("existsByUserIdAndProductId", () => {
		const userId = generateMockObjectId();
		const productId = generateMockObjectId();
		const reviewId = generateMockObjectId();
		const existsResult = { _id: reviewId };

		test("Should return 'reviewId' when'repo.existsByUserIdAndProductId' is called once with 'userId' and 'productId'", async () => {
			// Arrange
			mockRepo.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: existsResult, success: true }),
			);

			// Act
			const result = await service.existsByUserIdAndProductId({
				productId: productId.toString(),
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, existsResult);

			assert.strictEqual(
				mockRepo.existsByUserIdAndProductId.mock.callCount(),
				1,
			);
			assert.deepEqual(
				mockRepo.existsByUserIdAndProductId.mock.calls[0].arguments[0]
					.productId,

				productId,
			);
			assert.deepEqual(
				mockRepo.existsByUserIdAndProductId.mock.calls[0].arguments[0].userId,

				userId,
			);
		});

		test("Should return 'NotFoundError' when 'repo.existsByUserIdAndProductId' returns 'null'", async () => {
			// Arrange
			mockRepo.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.existsByUserIdAndProductId({
				productId: productId.toString(),
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'userId' is invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";
			const productId = generateMockObjectId().toString();

			// Act
			const result = await service.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";
			const userId = generateMockObjectId().toString();

			// Act
			const result = await service.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});
});
