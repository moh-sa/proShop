import assert from "node:assert/strict";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { DatabaseError, NotFoundError } from "../../errors";
import Product from "../../models/productModel";
import Review from "../../models/review.model";
import User from "../../models/userModel";
import { ReviewService } from "../../services";
import {
  generateMockObjectId,
  generateMockReview,
  generateMockReviews,
  generateMockSelectProduct,
} from "../mocks";
import { connectTestDatabase, disconnectTestDatabase } from "../utils";

before(async () => connectTestDatabase());
after(async () => disconnectTestDatabase());
beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Review.deleteMany({});
});
const service = new ReviewService();

suite("Review Service", () => {
  describe("Create Review", () => {
    test("Should create new review and return the data", async () => {
      const mockReview = generateMockReview();

      const response = await service.create({ data: mockReview });

      assert.ok(response);
      assert.equal(response.name, mockReview.name);
      assert.equal(response.rating, mockReview.rating);
    });

    test("Should throw 'DatabaseError' if the review already exists", async () => {
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      try {
        // creating duplicate review
        await service.create({ data: mockReview });
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.statusCode, 500);
        assert.ok(error.message.includes("E11000")); // error code for duplication
      }
    });

    test("Should throw 'DatabaseError' if the product was already reviewed by the same user", async () => {
      const mockReview = generateMockReview();

      await Review.create(mockReview);

      try {
        // creating duplicate review
        await service.create({ data: mockReview });
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.statusCode, 500);
        assert.ok(error.message.includes("E11000")); // error code for duplication
      }
    });
  });

  describe("Retrieve Review By ID", () => {
    test("Should retrieve a review by ID and return the data", async () => {
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      const response = await service.getById({ reviewId: mockReview._id });

      assert.ok(response);
      assert.equal(response.name, mockReview.name);
      assert.equal(response.comment, mockReview.comment);
      assert.equal(response.rating, mockReview.rating);
    });

    test("Should throw 'NotFoundError' if review does not exist", async () => {
      const mockId = generateMockObjectId();

      try {
        await service.getById({ reviewId: mockId });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Review not found");
      }
    });
  });

  describe("Retrieve Reviews", () => {
    test("Should retrieve array (4) of reviews", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const response = await service.getAll();
      assert.ok(response);
      assert.equal(response.length, 4);

      const allComments = response.map((review) => review.comment);
      assert.ok(allComments.includes(mockReviews[0].comment));
    });

    test("Should return an empty (0) array if no reviews exist", async () => {
      const reviews = await service.getAll();
      assert.equal(reviews.length, 0);
    });
  });

  describe("Retrieve Reviews By User ID", () => {
    test("Should retrieve (3) reviews for a specific user", async () => {
      const mockReviews = generateMockReviews(4);
      mockReviews[1].user = mockReviews[0].user;
      mockReviews[2].user = mockReviews[0].user;

      await Review.insertMany(mockReviews);

      const response = await service.getAllByUserId({
        userId: mockReviews[0].user,
      });

      assert.ok(response);
      assert.equal(response.length, 3);
    });

    test("Should return an empty (0) array if no reviews exist", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const response = await service.getAllByUserId({
        userId: generateMockObjectId(),
      });
      assert.equal(response.length, 0);
    });
  });

  describe("Retrieve Reviews By Product ID", () => {
    test("Should retrieve all (2) reviews for a specific product", async () => {
      const mockProduct = generateMockSelectProduct();
      const mockReviews = generateMockReviews(6);
      mockReviews[0].product = mockProduct._id;
      mockReviews[1].product = mockProduct._id;

      await Review.insertMany(mockReviews);

      const reviews = await service.getAllByProductId({
        productId: mockProduct._id,
      });

      assert.ok(reviews);
      assert.equal(reviews.length, 2);
    });

    test("Should return an empty array if no reviews exist", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const reviews = await service.getAllByProductId({
        productId: generateMockObjectId(),
      });

      assert.equal(reviews.length, 0);
    });
  });

  describe("Update Review", () => {
    test("Should find and update a review by ID and return the updated data", async () => {
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      const updateData = { comment: "RANDOM_COMMENT" };
      const updated = await service.update({
        reviewId: mockReview._id,
        data: updateData,
      });

      assert.ok(updated);
      assert.equal(updated.comment, updateData.comment);
    });

    test("Should throw 'NotFoundError' if review does not exist", async () => {
      const mockReview = generateMockReview();

      try {
        await service.update({
          reviewId: mockReview._id,
          data: { comment: "RANDOM_COMMENT" },
        });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Review not found");
      }
    });
  });

  describe("Delete Review", () => {
    test("Should delete a review by ID and throw 'NotFoundError' to ensure the review is deleted", async () => {
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      const deleted = await service.delete({
        reviewId: mockReview._id,
      });

      assert.ok(deleted);
      assert.equal(deleted.comment, mockReview.comment);
    });

    test("Should throw 'NotFoundError' if review does not exist", async () => {
      const mockId = generateMockObjectId();

      try {
        await service.delete({
          reviewId: mockId,
        });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Review not found");
      }
    });
  });
});
