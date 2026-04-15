import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import { ReviewController } from "../../controllers/index.js";
import type { CreateReview } from "../../types/index.js";
import { createSuccessResponseObject } from "../../utils/index.js";
import {
	generateMockObjectId,
	generateMockSelectReview,
	generateMockSelectReviews,
	mockExpressCall,
	mockReviewService,
} from "../mocks/index.js";

suite("Review Controller 〖 Unit Tests 〗", () => {
	const mockService = mockReviewService();
	const controller = new ReviewController(mockService);

	beforeEach(() => {
		mockService.reset();
	});

	describe("create", () => {
		const mockReview = generateMockSelectReview();

		test("Should call 'service.create' once with the correct 'review data'", async (t) => {
			// Arrange
			const selectMockReview = mockReview;

			const { next, req, res } = mockExpressCall({
				req: { body: mockReview },
				res: {
					locals: {
						user: {
							id: mockReview.user,
							name: mockReview.name,
						},
					},
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: selectMockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.create(req, res, next);

			// Assert
			assert.strictEqual(mockService.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.create.mock.calls[0].arguments[0],
				mockReview,
			);
		});

		test("Should call 'res.status' once with '201' after successfully creating review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockReview },
				res: {
					locals: { user: { id: mockReview.user, name: mockReview.name } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.create(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockReview },
				res: {
					locals: { user: { id: mockReview.user, name: mockReview.name } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.create(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockReview }),
			);
		});
	});

	describe("getAll", () => {
		const mockReviews = generateMockSelectReviews({ count: 5 });
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 5,
			totalPages: 1,
		};

		test("Should call 'service.getAll' once with pagination params from query", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						pageNumber: "1",
						pageSize: "10",
						sort: "createdAt:desc",
					},
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.ok(mockService.getAll.mock.calls[0].arguments[0]);
			assert.strictEqual(
				mockService.getAll.mock.calls[0].arguments[0].pageNumber,
				"1",
			);
			assert.strictEqual(
				mockService.getAll.mock.calls[0].arguments[0].pageSize,
				"10",
			);
			assert.strictEqual(
				mockService.getAll.mock.calls[0].arguments[0].sort,
				"createdAt:desc",
			);
			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0].filters,
				{ productId: undefined, userId: undefined },
			);
		});

		test("Should pass filters with productId and userId from query when provided", async (t) => {
			// Arrange
			const productId = generateMockObjectId();
			const userId = generateMockObjectId();

			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						pageNumber: "1",
						pageSize: "10",
						productId,
						userId,
					},
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0].filters,
				{ productId, userId },
			);
		});

		test("Should call 'service.getAll' once with default pagination params when no query provided", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.ok(mockService.getAll.mock.calls[0].arguments[0]);
			assert.strictEqual(
				mockService.getAll.mock.calls[0].arguments[0].pageNumber,
				"1",
			);
			assert.deepStrictEqual(
				mockService.getAll.mock.calls[0].arguments[0].filters,
				{ productId: undefined, userId: undefined },
			);
		});

		test("Should call'res.status' once with '200' after successfully fetching paginated reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing paginated reviews and meta", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: mockReviews,
				meta: mockPaginationMeta,
				success: true,
			});
		});
	});

	describe("getAllByUserId", () => {
		const mockReviews = generateMockSelectReviews({ count: 2 });
		const userId = mockReviews[0].user;
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 2,
			totalPages: 1,
		};

		test("Should call 'service.getAllByUserId' once with the correct 'userId' and pagination params", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1", pageSize: "10" },
				},
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
			assert.strictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].pageNumber,
				"1",
			);
			assert.strictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].pageSize,
				"10",
			);
			assert.deepStrictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].filters,
				{ productId: undefined },
			);
		});

		test("Should pass filters.productId from query when provided", async (t) => {
			// Arrange
			const productId = generateMockObjectId();

			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1", pageSize: "10", productId },
				},
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].filters,
				{ productId },
			);
		});

		test("Should call 'service.getAllByUserId' once with default pagination params when no query provided", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
			assert.strictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].pageNumber,
				"1",
			);
			assert.deepStrictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].filters,
				{ productId: undefined },
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching paginated reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing paginated reviews and meta", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { userId },
					query: { pageNumber: "1" },
				},
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByUserId(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: mockReviews,
				meta: mockPaginationMeta,
				success: true,
			});
		});
	});

	describe("getAllByProductId", () => {
		const mockReviews = generateMockSelectReviews({ count: 2 });
		const productId = mockReviews[0].product;
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 2,
			totalPages: 1,
		};

		test("Should call 'service.getAllByProductId' once with the correct 'productId' and pagination params", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { productId },
					query: { pageNumber: "1", pageSize: "10" },
				},
				testContext: t,
			});

			mockService.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByProductId(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAllByProductId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].productId,
				productId,
			);
			assert.strictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].pageNumber,
				"1",
			);
			assert.strictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].pageSize,
				"10",
			);
			assert.deepStrictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].filters,
				{ userId: undefined },
			);
		});

		test("Should pass filters.userId from query when provided", async (t) => {
			// Arrange
			const userIdFilter = generateMockObjectId();

			const { next, req, res } = mockExpressCall({
				req: {
					params: { productId },
					query: { pageNumber: "1", pageSize: "10", userId: userIdFilter },
				},
				testContext: t,
			});

			mockService.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByProductId(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAllByProductId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].filters,
				{ userId: userIdFilter },
			);
		});

		test("Should call 'service.getAllByProductId' once with default pagination params when no query provided", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { productId },
					query: { pageNumber: "1" },
				},
				testContext: t,
			});

			mockService.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByProductId(req, res, next);

			// Assert
			assert.strictEqual(mockService.getAllByProductId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].productId,
				productId,
			);
			assert.strictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].pageNumber,
				"1",
			);
			assert.deepStrictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].filters,
				{ userId: undefined },
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching paginated reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { productId },
					query: { pageNumber: "1" },
				},
				testContext: t,
			});

			mockService.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByProductId(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing paginated reviews and meta", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: { productId },
					query: { pageNumber: "1" },
				},
				testContext: t,
			});

			mockService.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: mockReviews, meta: mockPaginationMeta },
					success: true,
				}),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAllByProductId(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
				data: mockReviews,
				meta: mockPaginationMeta,
				success: true,
			});
		});
	});

	describe("getById", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview.id;

		test("Should call 'service.getById' once with the correct 'reviewId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.strictEqual(mockService.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getById.mock.calls[0].arguments[0].reviewId,
				reviewId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockReview }),
			);
		});
	});

	describe("update", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview.id;

		test("Should call 'service.update' once with the correct 'reviewId'", async (t) => {
			// Arrange
			const updateData: Partial<CreateReview> = { name: "new-name" };

			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { reviewId },
				},
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.update(req, res, next);

			// Assert
			assert.strictEqual(mockService.update.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.update.mock.calls[0].arguments[0].reviewId,
				reviewId,
			);
			assert.deepStrictEqual(
				mockService.update.mock.calls[0].arguments[0].data,
				updateData,
			);
		});

		test("Should call 'res.status' once with '200' after successfully updating review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.update(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.update(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockReview }),
			);
		});
	});

	describe("delete", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview.id;

		test("Should call 'service.delete' once with the correct 'reviewId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.delete(req, res, next);

			// Assert
			assert.strictEqual(mockService.delete.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.delete.mock.calls[0].arguments[0].reviewId,
				reviewId,
			);
		});

		test("Should call 'res.status' once with '204' after successfully deleting review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.delete(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.delete(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: null }),
			);
		});
	});

	describe("count", () => {
		const mockCount = 5;

		test("Should call 'service.count' once without args", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.count.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.count(req, res, next);

			// Assert
			assert.strictEqual(mockService.count.mock.callCount(), 1);
			assert.strictEqual(mockService.count.mock.calls[0].arguments.length, 0);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.count.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.count(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.count.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.count(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockCount }),
			);
		});
	});

	describe("countByUserId", () => {
		const mockCount = 5;
		const userId = generateMockObjectId();

		test("Should call 'service.countByUserId' once with the correct 'userId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.countByUserId(req, res, next);

			// Assert
			assert.strictEqual(mockService.countByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.countByUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.countByUserId(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId } },
				testContext: t,
			});

			mockService.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.countByUserId(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockCount }),
			);
		});
	});

	describe("countByProductId", () => {
		const mockCount = 5;
		const productId = generateMockObjectId();

		test("Should call 'service.countByProductId' once with the correct 'productId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockService.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.countByProductId(req, res, next);

			// Assert
			assert.strictEqual(mockService.countByProductId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.countByProductId.mock.calls[0].arguments[0].productId,
				productId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockService.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.countByProductId(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockService.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.countByProductId(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockCount }),
			);
		});
	});

	describe("existsById", () => {
		const id = generateMockObjectId();
		const reviewId = id;
		const serviceResult = { id };

		test("Should call 'service.existsById' once with the correct 'reviewId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.existsById(req, res, next);

			// Assert
			assert.strictEqual(mockService.existsById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.existsById.mock.calls[0].arguments[0].reviewId,
				reviewId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.existsById(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId } },
				testContext: t,
			});

			mockService.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.existsById(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: serviceResult }),
			);
		});
	});

	describe("existsByUserIdAndProductId", () => {
		const userId = generateMockObjectId();
		const productId = generateMockObjectId();
		const serviceResult = { id: generateMockObjectId() };

		test("Should call 'service.existsByUserIdAndProductId' once with the correct 'userId' and 'productId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: {
						productId: productId,
						userId: userId,
					},
				},
				testContext: t,
			});

			mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.existsByUserIdAndProductId(req, res, next);

			// Assert
			assert.strictEqual(
				mockService.existsByUserIdAndProductId.mock.callCount(),
				1,
			);
			assert.deepStrictEqual(
				mockService.existsByUserIdAndProductId.mock.calls[0].arguments[0]
					.productId,
				productId,
			);
			assert.deepStrictEqual(
				mockService.existsByUserIdAndProductId.mock.calls[0].arguments[0]
					.userId,
				userId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: {
						productId: productId,
						userId: userId,
					},
				},
				testContext: t,
			});

			mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.existsByUserIdAndProductId(req, res, next);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: {
						productId: productId,
						userId: userId,
					},
				},
				testContext: t,
			});

			mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.existsByUserIdAndProductId(req, res, next);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: serviceResult }),
			);
		});
	});
});
