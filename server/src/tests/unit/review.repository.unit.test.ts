import assert from "node:assert/strict";
import { beforeEach, describe, mock, suite, test } from "node:test";

import mongoose, { Types } from "mongoose";

import {
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	DatabaseValidationError,
	GenericDatabaseError,
} from "../../errors/index.js";
import { ReviewModel } from "../../models/review.model.js";
import { ReviewRepository } from "../../repositories/index.js";
import type { CreateReview } from "../../types/index.js";
import { Paginator } from "../../utils/index.js";
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
			const mockCreate = t.mock.method(ReviewModel, "create", () => ({
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

			t.mock.method(ReviewModel, "create", () => {
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

			t.mock.method(ReviewModel, "create", () => {
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

			t.mock.method(ReviewModel, "create", () => {
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

			t.mock.method(ReviewModel, "create", () => {
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

			t.mock.method(ReviewModel, "create", () => {
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
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 4,
			totalPages: 1,
		};

		test("Should return paginated reviews when 'paginator.paginate' is called once with pagination params", async (t) => {
			// Arrange
			const pageNumber = 1;
			const pageSize = 10;
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockReviews,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			const reviews = await repo.getAll({
				pageNumber,
				pageSize,
			});

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(reviews.data);
			assert.ok(reviews.data.items);
			assert.ok(reviews.data.meta);

			assert.strictEqual(Array.isArray(reviews.data.items), true);
			assert.strictEqual(reviews.data.items.length, mockReviews.length);
			assert.deepStrictEqual(reviews.data.items, mockReviews);
			assert.deepStrictEqual(reviews.data.meta, mockPaginationMeta);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.ok(paginateMock.mock.calls[0].arguments[0]);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageNumber,
				pageNumber,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageSize,
				pageSize,
			);
		});

		test("Should call 'paginator.paginate' with filters converted to ObjectId query fields", async (t) => {
			// Arrange
			const productId = generateMockObjectId();
			const userId = generateMockObjectId();
			const mockPaginate = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockReviews,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: {
					productId: productId,
					userId: userId,
				},
			});

			// Assert
			const paginateArgs = mockPaginate.mock.calls[0].arguments[0];
			assert.ok(paginateArgs);
			assert.ok(paginateArgs.query);
			assert.ok(paginateArgs.query.product instanceof mongoose.Types.ObjectId);
			assert.ok(paginateArgs.query.user instanceof mongoose.Types.ObjectId);
			assert.strictEqual(paginateArgs.query.product.toString(), productId);
			assert.strictEqual(paginateArgs.query.user.toString(), userId);
		});

		test("Should call 'paginator.paginate' with sort parameters", async (t) => {
			// Arrange
			const mockPaginate = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockReviews,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
				sort: { createdAt: "desc", rating: "asc" },
			});

			// Assert
			assert.deepStrictEqual(mockPaginate.mock.calls[0].arguments[0]?.sort, {
				createdAt: "desc",
				rating: "asc",
			});
		});

		test("Should call 'paginator.paginate' with select when select is provided", async (t) => {
			// Arrange
			const mockPaginate = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockReviews,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
				select: { comment: true, rating: true },
			});

			// Assert
			assert.deepStrictEqual(mockPaginate.mock.calls[0].arguments[0]?.select, {
				comment: true,
				rating: true,
			});
		});

		test("Should return empty paginated result when 'paginator.paginate' returns empty items", async (t) => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: emptyMeta,
				}),
			);

			// Act
			const reviews = await repo.getAll({ pageNumber: 1, pageSize: 10 });

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 0);
			assert.deepStrictEqual(reviews.data.meta, emptyMeta);
		});

		test("Should return 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAll({ pageNumber: 1, pageSize: 10 });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAll({ pageNumber: 1, pageSize: 10 });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAll({ pageNumber: 1, pageSize: 10 });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAll({ pageNumber: 1, pageSize: 10 });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAll({ pageNumber: 1, pageSize: 10 });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getById", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview.id;

		test("Should return review object when 'db.findById' is called once with 'reviewId'", async (t) => {
			// Arrange
			const findByIdMock = t.mock.method(ReviewModel, "findById", () => ({
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
			t.mock.method(ReviewModel, "findById", () => ({
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

			t.mock.method(ReviewModel, "findById", () => {
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

			t.mock.method(ReviewModel, "findById", () => {
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

			t.mock.method(ReviewModel, "findById", () => {
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

			t.mock.method(ReviewModel, "findById", () => {
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

			t.mock.method(ReviewModel, "findById", () => {
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
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 5,
			totalPages: 1,
		};

		test("Should return paginated reviews when 'paginator.paginate' is called once with 'userId'", async (t) => {
			// Arrange
			const pageNumber = 1;
			const pageSize = 10;
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockReviews,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			const reviews = await repo.getAllByUserId({
				pageNumber,
				pageSize,
				userId: userId,
			});

			// Assert
			assert.ok(reviews);
			assert.strictEqual(reviews.success, true);
			assert.ok(reviews.data);
			assert.ok(reviews.data.items);
			assert.ok(reviews.data.meta);

			assert.strictEqual(Array.isArray(reviews.data.items), true);
			assert.strictEqual(reviews.data.items.length, mockReviews.length);
			assert.deepStrictEqual(reviews.data.items, mockReviews);
			assert.deepStrictEqual(reviews.data.meta, mockPaginationMeta);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.ok(paginateMock.mock.calls[0].arguments[0]);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageNumber,
				pageNumber,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageSize,
				pageSize,
			);
			assert.deepStrictEqual(paginateMock.mock.calls[0].arguments[0].query, {
				user: new Types.ObjectId(userId),
			});
		});

		test("Should merge filters.productId with scoped userId in paginate query", async (t) => {
			// Arrange
			const productId = generateMockObjectId();
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockReviews,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId,
				filters: { productId: productId },
			});

			// Assert
			const firstCall = paginateMock.mock.calls[0]?.arguments[0];
			assert.ok(firstCall);
			assert.deepStrictEqual(firstCall.query, {
				product: new Types.ObjectId(productId),
				user: new Types.ObjectId(userId),
			});
		});

		test("Should return empty paginated result when 'paginator.paginate' returns empty items", async (t) => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: emptyMeta,
				}),
			);

			// Act
			const reviews = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId,
			});

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 0);
			assert.deepStrictEqual(reviews.data.meta, emptyMeta);
		});

		test("Should return 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAllByProductId", () => {
		const mockReviews = generateMockSelectReviews({ count: 5 });
		const productId = mockReviews[0].product;
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 5,
			totalPages: 1,
		};

		test("Should return paginated reviews when 'paginator.paginate' is called once with 'productId'", async (t) => {
			// Arrange
			const pageNumber = 1;
			const pageSize = 10;
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockReviews,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			const reviews = await repo.getAllByProductId({
				pageNumber,
				pageSize,
				productId: productId,
			});

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(reviews.data);
			assert.ok(reviews.data.items);
			assert.ok(reviews.data.meta);

			assert.strictEqual(Array.isArray(reviews.data.items), true);
			assert.strictEqual(reviews.data.items.length, mockReviews.length);
			assert.deepStrictEqual(reviews.data.items, mockReviews);
			assert.deepStrictEqual(reviews.data.meta, mockPaginationMeta);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.ok(paginateMock.mock.calls[0].arguments[0]);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageNumber,
				pageNumber,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageSize,
				pageSize,
			);
			assert.deepStrictEqual(paginateMock.mock.calls[0].arguments[0].query, {
				product: new Types.ObjectId(productId),
			});
		});

		test("Should merge filters.userId with scoped productId in paginate query", async (t) => {
			// Arrange
			const userId = generateMockObjectId();
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockReviews,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			await repo.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId,
				filters: { userId: userId },
			});

			// Assert
			const mergeCall = paginateMock.mock.calls[0]?.arguments[0];
			assert.ok(mergeCall);
			assert.deepStrictEqual(mergeCall.query, {
				product: new Types.ObjectId(productId),
				user: new Types.ObjectId(userId),
			});
		});

		test("Should return empty paginated result when 'paginator.paginate' returns empty items", async (t) => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: emptyMeta,
				}),
			);

			// Act
			const reviews = await repo.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId,
			});

			// Assert
			assert.strictEqual(reviews.success, true);
			assert.ok(Array.isArray(reviews.data.items));
			assert.strictEqual(reviews.data.items.length, 0);
			assert.deepStrictEqual(reviews.data.meta, emptyMeta);
		});

		test("Should return 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllByProductId({
				pageNumber: 1,
				pageSize: 10,
				productId: productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("update", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview.id;
		const updateData: Partial<CreateReview> = { comment: "new-comment" };
		const expectedResult = { ...mockReview, ...updateData };

		test("Should return review object when 'db.findByIdAndUpdate' is called once with 'reviewId' and 'updateData'", async (t) => {
			// Arrange
			const findByIdAndUpdateMock = t.mock.method(
				ReviewModel,
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
			t.mock.method(ReviewModel, "findByIdAndUpdate", () => ({
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

			t.mock.method(ReviewModel, "findByIdAndUpdate", () => {
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

			t.mock.method(ReviewModel, "findByIdAndUpdate", () => {
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

			t.mock.method(ReviewModel, "findByIdAndUpdate", () => {
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

			t.mock.method(ReviewModel, "findByIdAndUpdate", () => {
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

			t.mock.method(ReviewModel, "findByIdAndUpdate", () => {
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
		const reviewId = mockReview.id;

		test("Should return review object when 'db.findByIdAndDelete' is called once with'reviewId'", async (t) => {
			// Arrange
			const findByIdAndDeleteMock = t.mock.method(
				ReviewModel,
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
			t.mock.method(ReviewModel, "findByIdAndDelete", () => ({
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

			t.mock.method(ReviewModel, "findByIdAndDelete", () => {
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

			t.mock.method(ReviewModel, "findByIdAndDelete", () => {
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

			t.mock.method(ReviewModel, "findByIdAndDelete", () => {
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

			t.mock.method(ReviewModel, "findByIdAndDelete", () => {
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

			t.mock.method(ReviewModel, "findByIdAndDelete", () => {
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
				ReviewModel,
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
			t.mock.method(ReviewModel, "countDocuments", () => ({
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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
				ReviewModel,
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
			t.mock.method(ReviewModel, "countDocuments", () => ({
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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
				ReviewModel,
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
			t.mock.method(ReviewModel, "countDocuments", () => ({
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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

			t.mock.method(ReviewModel, "countDocuments", () => {
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
		const expectedResult = { id: reviewId };

		test("Should return the 'reviewId' when 'db.exists' is called once with 'reviewId'", async (t) => {
			// Arrange
			const existsMock = t.mock.method(ReviewModel, "exists", () => ({
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
			t.mock.method(ReviewModel, "exists", () => ({
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

			t.mock.method(ReviewModel, "exists", () => {
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

			t.mock.method(ReviewModel, "exists", () => {
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

			t.mock.method(ReviewModel, "exists", () => {
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

			t.mock.method(ReviewModel, "exists", () => {
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

			t.mock.method(ReviewModel, "exists", () => {
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
		const expectedResult = { id: reviewId };

		test("Should return 'reviewId' when 'db.exists' is called once with 'userId' and 'productId'", async (t) => {
			// Arrange
			const existsMock = t.mock.method(ReviewModel, "exists", () => ({
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
			t.mock.method(ReviewModel, "exists", () => ({
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

			t.mock.method(ReviewModel, "exists", () => {
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

			t.mock.method(ReviewModel, "exists", () => {
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

			t.mock.method(ReviewModel, "exists", () => {
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

			t.mock.method(ReviewModel, "exists", () => {
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

			t.mock.method(ReviewModel, "exists", () => {
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
