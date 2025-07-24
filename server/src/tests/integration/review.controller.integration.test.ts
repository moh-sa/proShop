import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { ReviewController } from "../../controllers";
import { NotFoundError } from "../../errors";
import Review from "../../models/review.model";
import {
  generateMockInsertReview,
  generateMockObjectId,
  generateMockSelectReview,
  generateMockSelectReviews,
  generateMockUser,
} from "../mocks";
import { createMockExpressContext } from "../utils";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("Review Controller 〖 Integration Tests 〗", () => {
  const controller = new ReviewController();

  before(async () => await connectTestDatabase());
  after(async () => await disconnectTestDatabase());
  beforeEach(async () => await Review.deleteMany({}));

  describe("create", () => {
    test("Should return success response when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockReview = generateMockInsertReview({
        user: mockUser._id,
      });

      const { req, res, next } = createMockExpressContext();
      req.body = mockReview;
      res.locals.user = mockUser;

      // Act
      await controller.create(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '201' status code when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockReview = generateMockInsertReview({
        user: mockUser._id,
      });

      const { req, res, next } = createMockExpressContext();
      req.body = mockReview;
      res.locals.user = mockUser;

      // Act
      await controller.create(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 201);
    });

    test("Should create review when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockReview = generateMockInsertReview({
        user: mockUser._id,
      });

      const { req, res, next } = createMockExpressContext();
      req.body = mockReview;
      res.locals.user = mockUser;

      // Act
      await controller.create(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(response.data._id);
      assert.strictEqual(response.data.user, mockReview.user.toString());
      assert.strictEqual(response.data.product, mockReview.product.toString());
      assert.strictEqual(response.data.name, mockUser.name);
      assert.strictEqual(response.data.rating, mockReview.rating);
      assert.strictEqual(response.data.comment, mockReview.comment);
    });

    test("Should throw 'ZodError' when 'service.create' is called without 'rating' required field", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { rating, ...mockReview } = generateMockInsertReview({
        user: mockUser._id,
      });

      const { req, res, next } = createMockExpressContext();
      req.body = mockReview;
      res.locals.user = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "rating");
          assert.strictEqual(
            error.errors[0].message,
            "Expected number, received nan",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.create' is called without 'comment' required field", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { comment, ...mockReview } = generateMockInsertReview({
        user: mockUser._id,
      });

      const { req, res, next } = createMockExpressContext();
      req.body = mockReview;
      res.locals.user = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "comment");
          assert.strictEqual(error.errors[0].message, "Required");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.create' is called without 'product' required field", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { product, ...mockReviewData } = generateMockInsertReview({
        user: mockUser._id,
      });

      const { req, res, next } = createMockExpressContext();
      req.body = mockReviewData;
      res.locals.user = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "product");
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.create' is called with out of range 'rating'", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockReviewData = generateMockInsertReview({
        user: mockUser._id,
        rating: 6,
      });

      const { req, res, next } = createMockExpressContext();
      req.body = mockReviewData;
      res.locals.user = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "rating");
          assert.strictEqual(
            error.errors[0].message,
            "Rating must be between 1 and 5.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.create' is called with invalid 'product' format", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const mockReviewData = generateMockInsertReview({
        user: mockUser._id,
        // @ts-expect-error - testing invalid product format
        product: "invalid-product-id",
      });

      const { req, res, next } = createMockExpressContext();
      req.body = mockReviewData;
      res.locals.user = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "product");
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("getById", () => {
    test("Should return success response when 'service.getById' is called with valid 'reviewId'", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.getById' is called with valid 'reviewId'", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return review object when 'service.getById' is called with existing 'reviewId'", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.user, mockReview.user.toString());
      assert.strictEqual(response.data.product, mockReview.product.toString());
      assert.strictEqual(response.data.name, mockReview.name);
      assert.strictEqual(response.data.rating, mockReview.rating);
      assert.strictEqual(response.data.comment, mockReview.comment);
    });

    test("Should throw 'NotFoundError' when 'service.getById' is called with non-existent 'reviewId'", async () => {
      // Arrange
      const reviewId = generateMockObjectId();
      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: reviewId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getById(req, res, next),
        (error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.getById' is called with invalid 'reviewId' format", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getById(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("getAll", () => {
    test("Should return success response when 'service.getAll' is called", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.ok(response.data.length > 0);
    });

    test("Should return '200' status code when 'service.getAll' is called", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return array of reviews when 'service.getAll' is called with reviews in database", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(Array.isArray(response.data));
      assert.strictEqual(response.data.length, mockReviews.length);
    });

    test("Should return empty array when 'service.getAll' is called with no reviews in database", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 0);
    });
  });

  describe("getAllByUserId", () => {
    test("Should return success response when 'service.getAllByUserId' is called with valid 'userId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: mockReviews[0].user.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.ok(response.data.length > 0);
    });

    test("Should return '200' status code when 'service.getAllByUserId' is called with valid 'userId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: mockReviews[0].user.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return array of reviews for specific user when 'service.getAllByUserId' is called", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({
        count: 3,
        options: { user: userId },
      });
      const otherReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany([mockReviews, otherReviews].flat());

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: userId.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(Array.isArray(response.data));
      assert.strictEqual(response.data.length, mockReviews.length);
      mockReviews.forEach((review) => {
        assert.ok(
          response.data.some(
            (r: any) => r._id.toString() === review._id.toString(),
          ),
        );
      });
    });

    test("Should return empty array when 'service.getAllByUserId' is called with user who has no reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const otherReviews = generateMockSelectReviews({ count: 2 }); // Different user
      await Review.insertMany(otherReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: userId.toString() };

      // Act
      await controller.getAllByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 0);
    });

    test("Should throw 'ZodError' when 'service.getAllByUserId' is called with invalid userId format", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { userId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getAllByUserId(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("getAllByProductId", () => {
    test("Should return success response when 'service.getAllByProductId' is called with valid 'productId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: mockReviews[0].product.toString() };

      // Act
      await controller.getAllByProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.ok(response.data.length > 0);
    });

    test("Should return '200' status code when 'service.getAllByProductId' is called with valid 'productId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: mockReviews[0].product.toString() };

      // Act
      await controller.getAllByProductId(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return array of reviews for specific product when 'service.getAllByProductId' is called", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({
        count: 3,
        options: { product: productId },
      });
      const otherReviews = generateMockSelectReviews({ count: 2 }); // Different product
      await Review.insertMany([mockReviews, otherReviews].flat());

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: productId.toString() };

      // Act
      await controller.getAllByProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(Array.isArray(response.data));
      assert.strictEqual(response.data.length, mockReviews.length);
      mockReviews.forEach((review) => {
        assert.ok(
          response.data.some(
            (r: any) => r._id.toString() === review._id.toString(),
          ),
        );
      });
    });

    test("Should return empty array when 'service.getAllByProductId' is called with product that has no reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const otherReviews = generateMockSelectReviews({ count: 2 }); // Different product
      await Review.insertMany(otherReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: productId.toString() };

      // Act
      await controller.getAllByProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 0);
    });

    test("Should throw 'ZodError' when 'service.getAllByProductId' is called with invalid productId format", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { productId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getAllByProductId(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("update", () => {
    test("Should return success response when 'service.update' is called with 'reviewId' and valid update data", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.update' is called with 'reviewId' and valid update data", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.update(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return updated review when 'service.update' is called with 'reviewId' and valid update data", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      const updateData = { comment: "UPDATED COMMENT", rating: 5 };
      req.params = { reviewId: mockReview._id.toString() };
      req.body = updateData;

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data.comment, updateData.comment);
      assert.strictEqual(response.data.rating, updateData.rating);
    });

    test("Should update only provided fields when 'service.update' is called with partial data", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      const updateData = { comment: "UPDATED COMMENT ONLY" };
      req.params = { reviewId: mockReview._id.toString() };
      req.body = updateData;

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data.comment, updateData.comment);
      assert.strictEqual(response.data.rating, mockReview.rating); // Should remain unchanged
    });

    test("Should throw 'NotFoundError' when 'service.update' is called with non-existent 'reviewId'", async () => {
      // Arrange
      const reviewId = generateMockObjectId();
      const otherReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany(otherReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: reviewId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.update(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.update' is called with invalid 'objectId'", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.update(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.update' is called with invalid rating value", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };
      req.body = { rating: 6 }; // Invalid rating (> 5)

      // Act & Assert
      await assert.rejects(
        async () => await controller.update(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "rating");
          assert.strictEqual(
            error.errors[0].message,
            "Rating must be between 1 and 5.",
          );
          return true;
        },
      );
    });
  });

  describe("delete", () => {
    test("Should return success response when 'service.delete' is called with 'reviewId'", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.delete(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
    });

    test("Should return '204' status code when 'service.delete' is called with 'reviewId'", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.delete(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 204);
    });

    test("Should return 'data' equals to 'null' when 'service.delete' is called with 'reviewId'", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.delete(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data, null);
    });

    test("Should throw 'NotFoundError' when 'service.delete' is called with non-existent 'reviewId'", async () => {
      // Arrange
      const reviewId = generateMockObjectId();
      const otherReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany(otherReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: reviewId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.delete(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.delete' is called with invalid 'objectId'", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.delete(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("count", () => {
    test("Should return success response when 'service.count' is called", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.count(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.count' is called", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.count(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return 'data' type of 'number' when 'service.count' is called", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.count(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(typeof response.data, "number");
    });

    test("Should return correct count when 'service.count' is called with reviews in database", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 5 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.count(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data, mockReviews.length);
    });

    test("Should return zero when 'service.count' is called with no reviews in database", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.count(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data, 0);
    });
  });

  describe("countByUserId", () => {
    test("Should return success response when 'service.countByUserId' is called with 'userId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: mockReviews[0].user.toString() };

      // Act
      await controller.countByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.countByUserId' is called with 'userId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: mockReviews[0].user.toString() };

      // Act
      await controller.countByUserId(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return 'data' type of 'number' when 'service.count' is called", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: mockReviews[0].user.toString() };

      // Act
      await controller.countByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(typeof response.data, "number");
    });

    test("Should return correct count for specific user when 'service.countByUserId' is called with 'userId'", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({
        count: 3,
        options: { user: userId },
      });
      const otherReviews = generateMockSelectReviews({ count: 2 }); // Different user
      await Review.insertMany([mockReviews, otherReviews].flat());

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: userId.toString() };

      // Act
      await controller.countByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data, mockReviews.length);
    });

    test("Should return zero when 'service.countByUserId' is called with user who has no reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const otherReviews = generateMockSelectReviews({ count: 2 }); // Different user
      await Review.insertMany(otherReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { userId: userId.toString() };

      // Act
      await controller.countByUserId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data, 0);
    });

    test("Should throw 'ZodError' when 'service.countByUserId' is called with invalid 'objectId'", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { userId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.countByUserId(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("countByProductId", () => {
    test("Should return success response when 'service.countByProductId' is called with 'productId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: mockReviews[0].product.toString() };

      // Act
      await controller.countByProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.countByProductId' is called with 'productId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: mockReviews[0].product.toString() };

      // Act
      await controller.countByProductId(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return 'data' type of 'number' when 'service.count' is called", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: mockReviews[0].product.toString() };

      // Act
      await controller.countByProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(typeof response.data, "number");
    });

    test("Should return correct count for specific product when 'service.countByProductId' is called with 'productId'", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({
        count: 4,
        options: { product: productId },
      });
      const otherReviews = generateMockSelectReviews({ count: 2 }); // Different product
      await Review.insertMany([mockReviews, otherReviews].flat());

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: productId.toString() };

      // Act
      await controller.countByProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data, mockReviews.length);
    });

    test("Should return zero when 'service.countByProductId' is called with product that has no reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const otherReviews = generateMockSelectReviews({ count: 2 }); // Different product
      await Review.insertMany(otherReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = { productId: productId.toString() };

      // Act
      await controller.countByProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data, 0);
    });

    test("Should throw 'ZodError' when 'service.countByProductId' is called with invalid 'objectId'", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { productId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.countByProductId(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("existsById", () => {
    test("Should return success response when 'service.existsById' is called with valid data", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.existsById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.existsById' is called with 'reviewId'", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: mockReview._id.toString() };

      // Act
      await controller.existsById(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return 'review id' when 'service.existsById' is called with existing 'reviewId'", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 5 });
      await Review.insertMany(mockReviews);

      const { req, res, next } = createMockExpressContext();
      const targetReview = mockReviews[0];
      req.params = { reviewId: targetReview._id.toString() };

      // Act
      await controller.existsById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(
        response.data._id.toString(),
        targetReview._id.toString(),
      );
    });

    test("Should throw 'NotFoundError' when 'service.existsById' is called with non-existent review id", async () => {
      // Arrange
      const reviewId = generateMockObjectId();
      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: reviewId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.existsById(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.existsById' is called with invalid 'objectId'", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { reviewId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.existsById(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("existsByUserIdAndProductId", () => {
    test("Should return success response when 'service.existsByUserIdAndProductId' is called with valid data", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = {
        userId: mockReview.user.toString(),
        productId: mockReview.product.toString(),
      };

      // Act
      await controller.existsByUserIdAndProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.existsByUserIdAndProductId' is called with valid data", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      await Review.insertMany([mockReview]);

      const { req, res, next } = createMockExpressContext();
      req.params = {
        userId: mockReview.user.toString(),
        productId: mockReview.product.toString(),
      };

      // Act
      await controller.existsByUserIdAndProductId(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return 'review id' when 'service.existsByUserIdAndProductId' is called with existing combination", async () => {
      // Arrange
      const mockReview = generateMockSelectReview();
      const otherReview = generateMockSelectReviews({ count: 2 });
      await Review.insertMany([mockReview, otherReview].flat());

      const { req, res, next } = createMockExpressContext();
      req.params = {
        userId: mockReview.user.toString(),
        productId: mockReview.product.toString(),
      };

      // Act
      await controller.existsByUserIdAndProductId(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(
        response.data._id.toString(),
        mockReview._id.toString(),
      );
    });

    test("Should throw 'NotFoundError' when 'service.existsByUserIdAndProductId' is called with non-existent combination", async () => {
      // Arrange
      const mockId = generateMockObjectId();
      const otherReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany(otherReviews);

      const { req, res, next } = createMockExpressContext();
      req.params = {
        userId: mockId.toString(),
        productId: mockId.toString(),
      };

      // Act & Assert
      await assert.rejects(
        async () => await controller.existsByUserIdAndProductId(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.existsByUserIdAndProductId' is called with invalid 'userId'", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const { req, res, next } = createMockExpressContext();
      req.params = { userId: "invalid-id", productId: productId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.existsByUserIdAndProductId(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.existsByUserIdAndProductId' is called with invalid productId format", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const { req, res, next } = createMockExpressContext();
      req.params = { userId: userId.toString(), productId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.existsByUserIdAndProductId(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });
});
