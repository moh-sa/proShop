import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { reviewController } from "../../controllers";
import { DatabaseError, NotFoundError } from "../../errors";
import Product from "../../models/productModel";
import Review from "../../models/review.model";
import User from "../../models/userModel";
import {
  generateMockObjectId,
  generateMockReview,
  generateMockReviews,
  generateMockUser,
} from "../mocks";
import { createMockExpressContext, dbClose, dbConnect } from "../utils";

const controller = reviewController;

before(async () => dbConnect());
after(async () => dbClose());
beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Review.deleteMany({});
});

suite("Review Controller", () => {
  describe("Create Review", () => {
    test("Should create new review and return 201 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      const mockReview = generateMockReview();

      res.locals.user = mockUser;
      req.body = mockReview;

      await controller.create(req, res, next);

      assert.equal(res.statusCode, 201);

      const data = res._getJSONData();
      assert.equal(data.name, mockReview.name);
      assert.equal(data.comment, mockReview.comment);
    });

    test("Should throw 'ZodError' if the 'review' data is invalid", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      const mockReview = generateMockReview();

      res.locals.user = mockUser;
      req.body = { ...mockReview, rating: "RANDOM_STRING" };

      try {
        await controller.create(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues[0].path[0], "rating");
        assert.ok(error.issues[0].message.includes("Expected number"));
      }
    });

    test("Should throw 'DatabaseError' if the product was already reviewed by the same user", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      const mockReview = generateMockReview();

      res.locals.user = mockUser;
      req.body = mockReview;
      await Review.create({ ...mockReview, user: mockUser._id });

      try {
        // creating duplicate review
        await controller.create(req, res, next);
        assert.fail("Should throw 'DatabaseError'");
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.statusCode, 500);
        assert.ok(error.message.includes("E11000")); // error code for duplication
      }
    });
  });

  describe("Retrieve Review By ID", () => {
    test("Should retrieve review by ID and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      req.params.reviewId = mockReview._id.toString();

      await controller.getById(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.name, mockReview.name);
      assert.equal(data.comment, mockReview.comment);
    });

    test("Should throw 'NotFoundError' if review does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      req.params.reviewId = mockId.toString();

      try {
        await controller.getById(req, res, next);
        assert.fail("Should throw 'NotFoundError'");
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Review not found");
      }
    });

    test("Should throw 'ZodError' if the 'reviewId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = "RANDOM_STRING";

      req.params.reviewId = mockId;

      try {
        await controller.getById(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Retrieve Reviews", () => {
    test("Should retrieve all (4) reviews and return 200 with array of data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      await controller.getAll(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 4);
    });

    test("Should return empty (0) array if no reviews exist", async () => {
      const { req, res, next } = createMockExpressContext();

      await controller.getAll(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 0);
    });
  });

  describe("Retrieve Reviews By User ID", () => {
    test("Should retrieve all (3) reviews for a specific user and return 200 with array of data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReviews = generateMockReviews(4);
      mockReviews[1].user = mockReviews[0].user;
      mockReviews[2].user = mockReviews[0].user;
      await Review.insertMany(mockReviews);

      req.params.userId = mockReviews[0].user.toString();

      await controller.getAllByUserId(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 3);
    });

    test("Should return empty (0) array if no reviews exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      req.params.userId = mockId.toString();

      await controller.getAllByUserId(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 0);
    });
  });

  describe("Retrieve Reviews By Product ID", () => {
    test("Should retrieve all (4) reviews for a specific product and return 200 with array of data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReviews = generateMockReviews(6);
      mockReviews[1].product = mockReviews[0].product;
      mockReviews[2].product = mockReviews[0].product;
      mockReviews[3].product = mockReviews[0].product;
      await Review.insertMany(mockReviews);

      req.params.productId = mockReviews[0].product.toString();

      await controller.getAllByProductId(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 4);
    });

    test("Should return empty (0) array if no reviews exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      req.params.productId = mockId.toString();

      await controller.getAllByProductId(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 0);
    });
  });

  describe("Update Review", () => {
    test("Should find and update review by ID and return 200 with updated data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReview = generateMockReview();
      const updateData = { comment: "RANDOM_COMMENT" };
      await Review.create(mockReview);

      req.params.reviewId = mockReview._id.toString();
      req.body = updateData;

      await controller.update(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.comment, updateData.comment);
    });

    test("Should throw 'NotFoundError' if review does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      req.params.reviewId = mockId.toString();

      try {
        await controller.update(req, res, next);
        assert.fail("Should throw 'NotFoundError'");
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Review not found");
      }
    });

    test("Should throw 'ZodError' if the 'reviewId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = "RANDOM_STRING";

      req.params.reviewId = mockId;

      try {
        await controller.update(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });

    test("Should throw 'ZodError' if the update data is invalid", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();
      const updateData = { comment: 123456 };

      req.params.reviewId = mockId.toString();
      req.body = updateData;

      try {
        await controller.update(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].path[0], "comment");
        assert.ok(error.issues[0].message.includes("Expected string"));
      }
    });
  });

  describe("Delete Review", () => {
    test("Should delete review by ID and return 200 with message", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      req.params.reviewId = mockReview._id.toString();

      await controller.delete(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.message, "Review removed");
    });

    test("Should throw 'NotFoundError' if review does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      req.params.reviewId = mockId.toString();

      try {
        await controller.delete(req, res, next);
        assert.fail("Should throw 'NotFoundError'");
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Review not found");
      }
    });

    test("Should throw 'ZodError' if the 'reviewId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = "RANDOM_STRING";

      req.params.reviewId = mockId;

      try {
        await controller.delete(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Count Reviews", () => {
    test("Should return the number (6) of all the reviews", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReviews = generateMockReviews(6);
      await Review.insertMany(mockReviews);

      await controller.count(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.count, 6);
    });

    test("Should return 0 if no reviews exist", async () => {
      const { req, res, next } = createMockExpressContext();

      await controller.count(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.count, 0);
    });
  });

  describe("Count Reviews By User ID", () => {
    test("Should return the number (3) of all the reviews for a specific user", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReviews = generateMockReviews(4);
      mockReviews[1].user = mockReviews[0].user;
      mockReviews[2].user = mockReviews[0].user;
      await Review.insertMany(mockReviews);

      req.params.userId = mockReviews[0].user.toString();

      await controller.countByUserId(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.count, 3);
    });

    test("Should return 0 if no reviews exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReviews = generateMockReviews(4);
      const mockId = generateMockObjectId();
      await Review.insertMany(mockReviews);

      req.params.userId = mockId.toString();

      await controller.countByUserId(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.count, 0);
    });

    test("Should throw 'ZodError' if the 'userId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = "RANDOM_STRING";

      req.params.userId = mockId;

      try {
        await controller.countByUserId(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Count Reviews By Product ID", () => {
    test("Should return the number (2) of all the reviews for a specific product", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReviews = generateMockReviews(6);
      mockReviews[1].product = mockReviews[0].product;
      await Review.insertMany(mockReviews);

      req.params.productId = mockReviews[0].product.toString();

      await controller.countByProductId(req, res, next);

      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.count, 2);
    });

    test("Should return 0 if no reviews exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      req.params.productId = mockId.toString();

      await controller.countByProductId(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.count, 0);
    });

    test("Should throw 'ZodError' if the 'productId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = "RANDOM_STRING";

      req.params.productId = mockId;

      try {
        await controller.countByProductId(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Exists Review", () => {
    test("Should return review id if exists", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      req.params.reviewId = mockReview._id.toString();

      await controller.existsById(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data._id, mockReview._id);
    });

    test("Should throw 'NotFoundError' if review does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      req.params.reviewId = mockId.toString();

      try {
        await controller.existsById(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Review not found");
      }
    });

    test("Should throw 'ZodError' if the 'reviewId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = "RANDOM_STRING";

      req.params.reviewId = mockId;

      try {
        await controller.existsById(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Exists Review By User ID And Product ID", () => {
    test("Should return review id if both user and product ids exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockReview = generateMockReview();

      await Review.create(mockReview);

      req.params.userId = mockReview.user.toString();
      req.params.productId = mockReview.product.toString();

      await controller.existsByUserIdAndProductId(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data._id, mockReview._id);
    });

    test("Should throw 'NotFoundError' if review does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      req.params.userId = mockId.toString();
      req.params.productId = mockId.toString();

      try {
        await controller.existsByUserIdAndProductId(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Review not found");
      }
    });

    test("Should throw 'ZodError' if the 'userId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = "RANDOM_STRING";

      req.params.userId = mockId;

      try {
        await controller.existsByUserIdAndProductId(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });

    test("Should throw 'ZodError' if the 'productId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId1 = generateMockObjectId();
      const mockId2 = "RANDOM_STRING";

      req.params.userId = mockId1.toString();
      req.params.productId = mockId2;

      try {
        await controller.existsByUserIdAndProductId(req, res, next);
        assert.fail("Should throw 'ZodError'");
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });
});
