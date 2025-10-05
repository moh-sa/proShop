import type { Request, Response } from "express";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import type { InsertReview } from "../../types/index.js";

import { ReviewController } from "../../controllers/index.js";
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
			const insertMockReview: InsertReview = {
				comment: mockReview.comment,
				name: mockReview.name,
				product: mockReview.product,
				rating: mockReview.rating,
				user: mockReview.user,
			};
			const selectMockReview = mockReview;

			const { next, req, res } = mockExpressCall({
				req: { body: insertMockReview },
				res: {
					locals: {
						user: {
							_id: insertMockReview.user,
							name: insertMockReview.name,
						},
					},
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: selectMockReview, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.create.mock.calls[0].arguments[0],
				insertMockReview,
			);
		});

		test("Should call 'res.status' once with '201' after successfully creating review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockReview },
				res: {
					locals: { user: { _id: mockReview.user, name: mockReview.name } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { body: mockReview },
				res: {
					locals: { user: { _id: mockReview.user, name: mockReview.name } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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

		test("Should call 'service.getAll' once without args", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await assert.doesNotReject(
				async () =>
					await controller.getAll(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.strictEqual(mockService.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should call'res.status' once with '200' after successfully fetching all reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing all reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockReviews }),
			);
		});
	});

	describe("getAllByUserId", () => {
		const mockReviews = generateMockSelectReviews({ count: 2 });
		const userId = mockReviews[0].user;

		test("Should call 'service.getAllByUserId' once with the correct 'userId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByUserId.mock.calls[0].arguments[0].userId,
				userId.toString(),
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching all reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing all reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.getAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await controller.getAllByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockReviews }),
			);
		});
	});

	describe("getAllByProductId", () => {
		const mockReviews = generateMockSelectReviews({ count: 2 });
		const productId = mockReviews[0].product;

		test("Should call 'service.getAllByProductId' once with the correct 'productId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await controller.getAllByProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAllByProductId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getAllByProductId.mock.calls[0].arguments[0].productId,
				productId.toString(),
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching all reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await controller.getAllByProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing all reviews", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getAllByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReviews, success: true }),
			);

			// Act
			await controller.getAllByProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockReviews }),
			);
		});
	});

	describe("getById", () => {
		const mockReview = generateMockSelectReview();
		const reviewId = mockReview._id;

		test("Should call 'service.getById' once with the correct 'reviewId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: reviewId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.getById.mock.calls[0].arguments[0].reviewId,
				reviewId.toString(),
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: reviewId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: reviewId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
		const reviewId = mockReview._id;

		test("Should call 'service.update' once with the correct 'reviewId'", async (t) => {
			// Arrange
			const updateData: Partial<InsertReview> = { name: "new-name" };

			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { reviewId: reviewId.toString() },
				},
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.update.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.update.mock.calls[0].arguments[0].reviewId,
				reviewId.toString(),
			);
			assert.deepStrictEqual(
				mockService.update.mock.calls[0].arguments[0].data,
				updateData,
			);
		});

		test("Should call 'res.status' once with '200' after successfully updating review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: reviewId.toString() } },
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: reviewId.toString() } },
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
		const reviewId = mockReview._id;

		test("Should call 'service.delete' once with the correct 'reviewId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: reviewId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.delete.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.delete.mock.calls[0].arguments[0].reviewId,
				reviewId.toString(),
			);
		});

		test("Should call 'res.status' once with '204' after successfully deleting review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: reviewId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: reviewId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockReview, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
			await controller.count(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
			await controller.count(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
			await controller.count(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			await controller.countByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.countByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.countByUserId.mock.calls[0].arguments[0].userId,
				userId.toString(),
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			await controller.countByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { userId: userId.toString() } },
				testContext: t,
			});

			mockService.countByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			await controller.countByUserId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

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
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			await controller.countByProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.countByProductId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.countByProductId.mock.calls[0].arguments[0].productId,
				productId.toString(),
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			await controller.countByProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review count", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.countByProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			// Act
			await controller.countByProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockCount }),
			);
		});
	});

	describe("existsById", () => {
		const mockReviewId = generateMockObjectId();
		const serviceResult = { _id: mockReviewId };

		test("Should call 'service.existsById' once with the correct 'reviewId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: mockReviewId.toString() } },
				testContext: t,
			});

			mockService.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.existsById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.existsById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockService.existsById.mock.calls[0].arguments[0].reviewId,
				mockReviewId.toString(),
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: mockReviewId.toString() } },
				testContext: t,
			});

			mockService.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.existsById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { reviewId: mockReviewId.toString() } },
				testContext: t,
			});

			mockService.existsById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.existsById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: serviceResult }),
			);
		});
	});

	describe("existsByUserIdAndProductId", () => {
		const mockUserId = generateMockObjectId();
		const mockProductId = generateMockObjectId();
		const serviceResult = { _id: generateMockObjectId() };

		test("Should call 'service.existsByUserIdAndProductId' once with the correct 'userId' and 'productId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: {
						productId: mockProductId.toString(),
						userId: mockUserId.toString(),
					},
				},
				testContext: t,
			});

			mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.existsByUserIdAndProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(
				mockService.existsByUserIdAndProductId.mock.callCount(),
				1,
			);
			assert.deepStrictEqual(
				mockService.existsByUserIdAndProductId.mock.calls[0].arguments[0]
					.productId,
				mockProductId.toString(),
			);
			assert.deepStrictEqual(
				mockService.existsByUserIdAndProductId.mock.calls[0].arguments[0]
					.userId,
				mockUserId.toString(),
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: {
						productId: mockProductId.toString(),
						userId: mockUserId.toString(),
					},
				},
				testContext: t,
			});

			mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.existsByUserIdAndProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing review data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					params: {
						productId: mockProductId.toString(),
						userId: mockUserId.toString(),
					},
				},
				testContext: t,
			});

			mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.existsByUserIdAndProductId(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: serviceResult }),
			);
		});
	});
});
