import { Request, Response } from "express";
import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";
import { ReviewController } from "../../controllers";
import { DatabaseError } from "../../errors";
import { InsertReview } from "../../types";
import { createSuccessResponseObject } from "../../utils";
import {
  generateMockObjectId,
  generateMockReview,
  generateMockReviews,
  mockExpressCall,
  mockReviewService,
} from "../mocks";

suite("Review Controller 〖 Unit Tests 〗", () => {
  const mockService = mockReviewService();
  const controller = new ReviewController(mockService);

  beforeEach(() => {
    mockService.reset();
  });

  describe("create", () => {
    const mockReview = generateMockReview();

    test("Should parse 'review data' from 'req.body' and 'res.locals'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockReview },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await assert.doesNotReject(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'review.user' is invalid objectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockReview },
        res: {
          locals: { user: { _id: "invalid-user-id", name: mockReview.name } },
        },
      });

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' if 'review.product' is invalid objectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: { ...mockReview, product: "invalid-product-id" } },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' if 'review.rating' is less than 0", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: { ...mockReview, rating: -1 } },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Rating must be a positive number.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' if 'review.rating' is greater than 5", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: { ...mockReview, rating: 6 } },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Rating must be between 1 and 5.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' if 'review.rating' is not a number", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: { ...mockReview, rating: "invalid-rating" } },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Expected number, received nan",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' if 'review.comment' is less than 1 char", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: { ...mockReview, comment: "" } },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(error.issues[0].message, "Comment is required.");
          return true;
        },
      );
    });

    test("Should call 'service.create' once with the correct 'review data'", async (t) => {
      const insertMockReview: InsertReview = {
        user: mockReview.user,
        product: mockReview.product,
        name: mockReview.name,
        rating: mockReview.rating,
        comment: mockReview.comment,
      };
      const selectMockReview = mockReview;

      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: insertMockReview },
        res: {
          locals: {
            user: {
              _id: insertMockReview.user,
              name: insertMockReview.name,
            },
          },
        },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.resolve(selectMockReview),
      );

      await controller.create(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.create.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.create.mock.calls[0].arguments[0], {
        data: insertMockReview,
      });
    });

    test("Should throw 'DatabaseError' if 'service.create' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockReview },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '201' after successfully creating review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockReview },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.create(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
    });

    test("Should call 'res.json' once with the success response object containing review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockReview },
        res: {
          locals: { user: { _id: mockReview.user, name: mockReview.name } },
        },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.create(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockReview }),
      );
    });
  });

  describe("getAll", () => {
    const mockReviews = generateMockReviews(5);

    test("Should call 'service.getAll' once without args", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await assert.doesNotReject(
        async () =>
          await controller.getAll(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );

      assert.strictEqual(mockService.getAll.mock.callCount(), 1);
      assert.strictEqual(mockService.getAll.mock.calls[0].arguments.length, 0);
    });

    test("Should throw 'DatabaseError' if'service.getAll' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getAll(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call'res.status' once with '200' after successfully fetching all reviews", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await controller.getAll(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing all reviews", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await controller.getAll(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockReviews }),
      );
    });
  });

  describe("getAllByUserId", () => {
    const mockReviews = generateMockReviews(2);
    const userId = mockReviews[0].user;

    test("Should parse 'userId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await assert.doesNotReject(
        async () =>
          await controller.getAllByUserId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: "invalid-user-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.getAllByUserId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.getAllByUserId' once with the correct 'userId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await controller.getAllByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.getAllByUserId.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.getAllByUserId.mock.calls[0].arguments[0],
        {
          userId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.getAllByUserId' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getAllByUserId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching all reviews", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await controller.getAllByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing all reviews", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await controller.getAllByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockReviews }),
      );
    });
  });

  describe("getAllByProductId", () => {
    const mockReviews = generateMockReviews(2);
    const productId = mockReviews[0].product;

    test("Should parse 'productId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.getAllByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await assert.doesNotReject(
        async () =>
          await controller.getAllByProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'productId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: "invalid-user-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.getAllByProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.getAllByProductId' once with the correct 'productId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.getAllByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await controller.getAllByProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.getAllByProductId.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.getAllByProductId.mock.calls[0].arguments[0],
        {
          productId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.getAllByProductId' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.getAllByProductId.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getAllByProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching all reviews", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.getAllByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await controller.getAllByProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing all reviews", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.getAllByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      await controller.getAllByProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockReviews }),
      );
    });
  });

  describe("getById", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;

    test("Should parse 'reviewId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await assert.doesNotReject(
        async () =>
          await controller.getById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'reviewId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: "invalid-review-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.getById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.getById' once with the correct 'reviewId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.getById.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.getById.mock.calls[0].arguments[0], {
        reviewId,
      });
    });

    test("Should throw 'DatabaseError' if 'service.getById' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockReview }),
      );
    });
  });

  describe("update", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;

    test("Should parse 'reviewId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.update.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await assert.doesNotReject(
        async () =>
          await controller.update(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'reviewId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: "invalid-review-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.update(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.update' once with the correct 'reviewId'", async (t) => {
      const updateData: Partial<InsertReview> = { name: "new-name" };

      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: updateData,
          params: { reviewId: reviewId.toString() },
        },
      });

      mockService.update.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.update(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.update.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.update.mock.calls[0].arguments[0], {
        reviewId,
        data: updateData,
      });
    });

    test("Should throw 'DatabaseError' if 'service.update' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.update.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.update(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully updating review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.update.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.update(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.update.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.update(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockReview }),
      );
    });
  });

  describe("delete", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;

    test("Should parse 'reviewId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await assert.doesNotReject(
        async () =>
          await controller.delete(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'reviewId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: "invalid-review-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.delete(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.delete' once with the correct 'reviewId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.delete(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.delete.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.delete.mock.calls[0].arguments[0], {
        reviewId,
      });
    });

    test("Should throw 'DatabaseError' if 'service.delete' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.delete(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '204' after successfully deleting review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.delete(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
    });

    test("Should call 'res.json' once with the success response object containing review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: reviewId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      await controller.delete(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

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
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.count.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.count(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.count.mock.callCount(), 1);
      assert.strictEqual(mockService.count.mock.calls[0].arguments.length, 0);
    });

    test("Should throw 'DatabaseError' if 'service.count' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.count.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.count(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching review count", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.count.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.count(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing review count", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.count.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.count(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

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

    test("Should parse 'userId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.countByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await assert.doesNotReject(
        async () =>
          await controller.countByUserId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: "invalid-user-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.countByUserId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.countByUserId' once with the correct 'userId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.countByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.countByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.countByUserId.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.countByUserId.mock.calls[0].arguments[0],
        {
          userId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.countByUserId' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.countByUserId.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.countByUserId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching review count", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.countByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.countByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing review count", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.countByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.countByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

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

    test("Should parse 'productId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.countByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await assert.doesNotReject(
        async () =>
          await controller.countByProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'productId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: "invalid-user-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.countByProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.countByProductId' once with the correct 'productId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.countByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.countByProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.countByProductId.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.countByProductId.mock.calls[0].arguments[0],
        {
          productId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.countByProductId' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.countByProductId.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.countByProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching review count", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.countByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.countByProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing review count", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.countByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      await controller.countByProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

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

    test("Should parse 'reviewId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: mockReviewId.toString() } },
      });

      mockService.existsById.mock.mockImplementationOnce(() =>
        Promise.resolve(serviceResult),
      );

      await assert.doesNotReject(
        async () =>
          await controller.existsById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'reviewId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: "invalid-review-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.existsById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.existsById' once with the correct 'reviewId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: mockReviewId.toString() } },
      });

      mockService.existsById.mock.mockImplementationOnce(() =>
        Promise.resolve(serviceResult),
      );

      await controller.existsById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.existsById.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.existsById.mock.calls[0].arguments[0],
        {
          reviewId: mockReviewId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.existsById' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: mockReviewId.toString() } },
      });

      mockService.existsById.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.existsById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: mockReviewId.toString() } },
      });

      mockService.existsById.mock.mockImplementationOnce(() =>
        Promise.resolve(serviceResult),
      );

      await controller.existsById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { reviewId: mockReviewId.toString() } },
      });

      mockService.existsById.mock.mockImplementationOnce(() =>
        Promise.resolve(serviceResult),
      );

      await controller.existsById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

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

    test("Should parse 'userId' and 'productId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: {
            userId: mockUserId.toString(),
            productId: mockProductId.toString(),
          },
        },
      });

      mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(serviceResult),
      );

      await assert.doesNotReject(
        async () =>
          await controller.existsByUserIdAndProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: {
            userId: "invalid-user-id",
            productId: mockProductId.toString(),
          },
        },
      });

      await assert.rejects(
        async () =>
          await controller.existsByUserIdAndProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' if 'productId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: {
            userId: mockUserId.toString(),
            productId: "invalid-product-id",
          },
        },
      });

      await assert.rejects(
        async () =>
          await controller.existsByUserIdAndProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.existsByUserIdAndProductId' once with the correct 'userId' and 'productId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: {
            userId: mockUserId.toString(),
            productId: mockProductId.toString(),
          },
        },
      });

      mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(serviceResult),
      );

      await controller.existsByUserIdAndProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(
        mockService.existsByUserIdAndProductId.mock.callCount(),
        1,
      );
      assert.deepStrictEqual(
        mockService.existsByUserIdAndProductId.mock.calls[0].arguments[0],
        {
          userId: mockUserId,
          productId: mockProductId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.existsByUserIdAndProductId' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: {
            userId: mockUserId.toString(),
            productId: mockProductId.toString(),
          },
        },
      });

      mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.existsByUserIdAndProductId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: {
            userId: mockUserId.toString(),
            productId: mockProductId.toString(),
          },
        },
      });

      mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(serviceResult),
      );

      await controller.existsByUserIdAndProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing review data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: {
            userId: mockUserId.toString(),
            productId: mockProductId.toString(),
          },
        },
      });

      mockService.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(serviceResult),
      );

      await controller.existsByUserIdAndProductId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: serviceResult }),
      );
    });
  });
});
