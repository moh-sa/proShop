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
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 4,
			totalPages: 1,
		};

		test("Should return 'paginated reviews' when 'repo.getAll' is called once with valid arguments", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.deepStrictEqual(result.data.items, mockReviews);

			assert.deepStrictEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].pageNumber,
				1,
			);
		});

		test("Should return 'empty paginated result' when 'repo.getAll' returns empty items", async () => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: [], meta: emptyMeta },
					success: true,
				}),
			);

			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);

			assert.deepStrictEqual(result.data.meta, emptyMeta);
		});

		test("Should return 'ValidationError' when service arguments are invalid", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "invalid",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should pass parsed 'sort' to 'repo.getAll' when 'sort' is valid", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "10",
				sort: "rating:desc",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0].sort, {
				rating: "desc",
			});
		});

		test("Should return 'ValidationError' when 'sort' is invalid", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "10",
				sort: "not-a-sort",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAllByUserId", () => {
		const mockReviews = generateMockSelectReviews({ count: 4 });
		const userId = mockReviews[0].user.toString();
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 4,
			totalPages: 1,
		};

		test("Should return 'paginated reviews' when 'repo.getAllByUserId' is called once with 'userId'", async () => {
			// Arrange
			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			const result = await service.getAllByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.deepStrictEqual(result.data.items, mockReviews);

			assert.deepStrictEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(mockRepo.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getAllByUserId.mock.calls[0].arguments[0].userId.toString(),
				userId,
			);
			assert.strictEqual(
				mockRepo.getAllByUserId.mock.calls[0].arguments[0].pageNumber,
				1,
			);
		});

		test("Should return 'empty paginated result' when 'repo.getAllByUserId' returns empty items", async () => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: [], meta: emptyMeta },
					success: true,
				}),
			);

			// Act
			const result = await service.getAllByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);

			assert.deepStrictEqual(result.data.meta, emptyMeta);
		});

		test("Should return 'ValidationError' if 'userId' is invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act
			const result = await service.getAllByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if service arguments are invalid", async () => {
			// Act
			const result = await service.getAllByUserId({
				pageNumber: "invalid",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'sort' is invalid", async () => {
			// Act
			const result = await service.getAllByUserId({
				pageNumber: "1",
				pageSize: "10",
				sort: "not-a-sort",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAllByProductId", () => {
		const mockReviews = generateMockSelectReviews({ count: 5 });
		const productId = mockReviews[0].product.toString();
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 5,
			totalPages: 1,
		};

		test("Should return 'paginated reviews' when 'repo.getAllByProductId' is called once with 'productId'", async () => {
			// Arrange
			mockRepo.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			const result = await service.getAllByProductId({
				pageNumber: "1",
				pageSize: "10",
				productId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.deepEqual(result.data.items, mockReviews);

			assert.deepEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(mockRepo.getAllByProductId.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.getAllByProductId.mock.calls[0].arguments[0].productId.toString(),
				productId,
			);
			assert.strictEqual(
				mockRepo.getAllByProductId.mock.calls[0].arguments[0].pageNumber,
				1,
			);
		});

		test("Should return 'empty paginated result' when no reviews exist", async () => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			mockRepo.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: [], meta: emptyMeta },
					success: true,
				}),
			);

			// Act
			const result = await service.getAllByProductId({
				pageNumber: "1",
				pageSize: "10",
				productId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);

			assert.deepEqual(result.data.meta, emptyMeta);
		});

		test("Should return 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act
			const result = await service.getAllByProductId({
				pageNumber: "1",
				pageSize: "10",
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' if service arguments are invalid", async () => {
			// Act
			const result = await service.getAllByProductId({
				pageNumber: "invalid",
				pageSize: "10",
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'sort' is invalid", async () => {
			// Act
			const result = await service.getAllByProductId({
				pageNumber: "1",
				pageSize: "10",
				productId,
				sort: "not-a-sort",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'filters.userId' is invalid ObjectId", async () => {
			// Act
			const result = await service.getAllByProductId({
				filters: { userId: "not-an-objectid" },
				pageNumber: "1",
				pageSize: "10",
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getById", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id.toString();

		test("Should return 'review object' when 'repo.getById' is called once with 'reviewId'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			const result = await service.getById({ reviewId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockReview);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getById.mock.calls[0].arguments[0].reviewId.toString(),
				reviewId,
			);
		});

		test("Should return 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.getById({ reviewId });

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
		const reviewId = mockReview._id.toString();
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
				reviewId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.update.mock.calls[0].arguments[0].reviewId.toString(),
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
				reviewId,
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
		const reviewId = mockReview._id.toString();

		test("Should return 'review object' when 'repo.delete' is called once with 'reviewId'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			const result = await service.delete({
				reviewId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, mockReview);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.delete.mock.calls[0].arguments[0].reviewId.toString(),
				reviewId,
			);
		});

		test("Should return 'NotFoundError' when 'repo.delete' returns 'null'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.delete({ reviewId });

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
		const userId = generateMockObjectId().toString();

		test("Should return the count as number when 'repo.countByUserId' is called once with 'userId'", async () => {
			// Arrange
			mockRepo.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			const result = await service.countByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(typeof result.data === "number");
			assert.strictEqual(result.data, mockCount);

			assert.strictEqual(mockRepo.countByUserId.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.countByUserId.mock.calls[0].arguments[0].userId.toString(),
				userId,
			);
		});

		test("Should return '0' when 'repo.countByUserId' returns '0'", async () => {
			// Arrange
			mockRepo.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: 0, success: true }),
			);

			// Act
			const result = await service.countByUserId({ userId });

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
		const productId = generateMockObjectId().toString();

		test("Should return the count as number when 'repo.countByProductId' is called once with 'productId'", async () => {
			// Arrange
			mockRepo.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			const result = await service.countByProductId({
				productId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(typeof result.data === "number");
			assert.strictEqual(result.data, mockCount);

			assert.strictEqual(mockRepo.countByProductId.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.countByProductId.mock.calls[0].arguments[0].productId.toString(),
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
				productId,
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
		const id = generateMockObjectId();
		const reviewId = id.toString();
		const expectedResult = { _id: id };

		test("Should return 'reviewId' when 'repo.existsById' is called once with 'reviewId'", async () => {
			// Arrange
			mockRepo.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.existsById({
				reviewId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.existsById.mock.callCount(), 1);
			assert.deepEqual(
				mockRepo.existsById.mock.calls[0].arguments[0].reviewId.toString(),
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
				reviewId,
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
		const userId = generateMockObjectId().toString();
		const productId = generateMockObjectId().toString();
		const id = generateMockObjectId();
		const reviewId = id.toString();
		const existsResult = { _id: id };

		test("Should return 'reviewId' when'repo.existsByUserIdAndProductId' is called once with 'userId' and 'productId'", async () => {
			// Arrange
			mockRepo.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: existsResult, success: true }),
			);

			// Act
			const result = await service.existsByUserIdAndProductId({
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepEqual(result.data, existsResult);

			assert.strictEqual(
				mockRepo.existsByUserIdAndProductId.mock.callCount(),
				1,
			);
			assert.deepEqual(
				mockRepo.existsByUserIdAndProductId.mock.calls[0].arguments[0].productId.toString(),

				productId,
			);
			assert.deepEqual(
				mockRepo.existsByUserIdAndProductId.mock.calls[0].arguments[0].userId.toString(),

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
				productId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' if 'userId' is invalid ObjectId", async () => {
			// Arrange
			const userId = "invalid-user-id";

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
