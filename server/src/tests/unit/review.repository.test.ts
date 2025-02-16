import assert from "node:assert/strict";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { DatabaseError } from "../../errors";
import Product from "../../models/productModel";
import Review from "../../models/review.model";
import User from "../../models/userModel";
import { reviewRepository } from "../../repositories";
import {
  generateMockObjectId,
  generateMockProduct,
  generateMockReview,
  generateMockReviews,
  generateMockUser,
} from "../mocks";
import { dbClose, dbConnect } from "../utils";

before(async () => dbConnect());
after(async () => dbClose());
beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Review.deleteMany({});
});
const repo = reviewRepository;

suite("Review Repository", () => {
  describe("Create Review", () => {
    test("Should create new review in the database", async () => {
      const mockReview = generateMockReview();

      const review = await repo.create({ data: mockReview });

      assert.ok(review);
      assert.equal(review.name, mockReview.name);
      assert.equal(review.rating, mockReview.rating);
    });

    test("Should create new review with different users", async () => {
      const mockUser1 = generateMockUser();
      const mockUser2 = generateMockUser();
      const mockProduct = generateMockProduct();
      const mockReview1 = generateMockReview();
      const mockReview2 = generateMockReview();

      await User.create(mockUser1);
      await User.create(mockUser2);
      await Product.create(mockProduct);

      const review1 = await repo.create({
        data: {
          ...mockReview1,
          product: mockProduct._id,
          user: mockUser1._id,
        },
      });

      const review2 = await repo.create({
        data: {
          ...mockReview2,
          product: mockProduct._id,
          user: mockUser2._id,
        },
      });

      assert.ok(review1);
      assert.ok(review2);

      assert.notEqual(review1._id, review2._id);
      assert.equal(review1.user, mockUser1._id);
      assert.equal(review2.user, mockUser2._id);
    });

    test("Should throw 'DatabaseError' if 'user' and 'product' already exist", async () => {
      const mockUser = generateMockUser();
      const mockProduct = generateMockProduct();
      const mockReview = generateMockReview();

      await User.create(mockUser);
      await Product.create(mockProduct);
      await repo.create({
        data: {
          ...mockReview,
          user: mockUser._id,
          product: mockProduct._id,
        },
      });

      try {
        // creating duplicate review
        await repo.create({
          data: {
            ...mockReview,
            user: mockUser._id,
            product: mockProduct._id,
          },
        });
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.ok(error.message.includes("E11000")); // error code for duplication
      }
    });
  });

  describe("Retrieve Review By ID", () => {
    test("Should retrieve a review by ID", async () => {
      const mockReview = generateMockReview();

      await repo.create({ data: mockReview });

      const review = await repo.getById({ reviewId: mockReview._id });

      assert.ok(review);
      assert.equal(review.name, mockReview.name);
      assert.equal(review.comment, mockReview.comment);
      assert.equal(review.rating, mockReview.rating);
    });

    test("Should return 'null' if review does not exist", async () => {
      const mockId = generateMockObjectId();

      const review = await repo.getById({ reviewId: mockId });
      assert.equal(review, null);
    });
  });

  describe("Retrieve Reviews", () => {
    test("Should retrieve all reviews", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const reviews = await repo.getAll();
      assert.ok(reviews);
      assert.equal(reviews.length, 4);

      const allComments = reviews.map((review) => review.comment);
      assert.ok(allComments.includes(mockReviews[0].comment));
    });

    test("Should return an empty array if no reviews exist", async () => {
      const reviews = await repo.getAll();
      assert.equal(reviews.length, 0);
    });
  });

  describe("Retrieve Reviews By User ID", () => {
    test("Should retrieve all reviews for a specific user", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const reviews = await repo.getAllByUserId({
        userId: mockReviews[0].user,
      });

      assert.ok(reviews);
      assert.equal(reviews.length, 1);
      assert.equal(reviews[0].comment, mockReviews[0].comment);
    });

    test("Should return an empty array if no reviews exist", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const reviews = await repo.getAllByUserId({
        userId: generateMockObjectId(),
      });
      assert.equal(reviews.length, 0);
    });
  });

  describe("Retrieve Reviews By Product ID", () => {
    test("Should retrieve all (2) reviews for a specific product", async () => {
      const mockProduct = generateMockProduct();
      const mockReviews = generateMockReviews(6);
      mockReviews[0].product = mockProduct._id;
      mockReviews[1].product = mockProduct._id;

      await Review.insertMany(mockReviews);

      const reviews = await repo.getAllByProductId({
        productId: mockProduct._id,
      });

      assert.ok(reviews);
      assert.equal(reviews.length, 2);
    });

    test("Should return an empty array if no reviews exist", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const reviews = await repo.getAllByProductId({
        productId: generateMockObjectId(),
      });

      assert.equal(reviews.length, 0);
    });
  });

  describe("Update Review", () => {
    test("Should find and update a review by ID", async () => {
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      const updateData = { comment: "RANDOM_COMMENT" };
      const updated = await repo.update({
        reviewId: mockReview._id,
        data: updateData,
      });

      assert.ok(updated);
      assert.equal(updated.comment, updateData.comment);
    });

    test("Should return 'null' if review does not exist", async () => {
      const mockReview = generateMockReview();

      const review = await repo.update({
        reviewId: mockReview._id,
        data: { comment: "RANDOM_COMMENT" },
      });

      assert.equal(review, null);
    });
  });

  describe("Delete Review", () => {
    test("Should find and delete a review by ID", async () => {
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      const deleted = await repo.delete({
        reviewId: mockReview._id,
      });

      const nonExistingReview = await repo.getById({
        reviewId: mockReview._id,
      });

      assert.equal(deleted?.comment, mockReview.comment);
      assert.equal(nonExistingReview, null);
    });

    test("Should return 'null' if review does not exist", async () => {
      const deleted = await repo.delete({
        reviewId: generateMockObjectId(),
      });

      assert.equal(deleted, null);
    });
  });

  describe("Count Reviews", () => {
    test("Should return the number (6) of all the reviews", async () => {
      const mockReviews = generateMockReviews(6);
      await Review.insertMany(mockReviews);

      const count = await repo.count();
      assert.equal(count, 6);
    });

    test("Should return 0 if no reviews exist", async () => {
      const count = await repo.count();
      assert.equal(count, 0);
    });
  });

  describe("Count Reviews By User ID", () => {
    test("Should return the number (3) of all the reviews for a specific user", async () => {
      const [mockReview1, ...mockReviews] = generateMockReviews(4);
      const mockData = mockReviews.map((review) => ({
        ...review,
        user: mockReviews[0].user,
      }));
      await Review.insertMany([mockReview1, ...mockData]);

      const count = await repo.countByUserId({
        userId: mockReviews[0].user,
      });

      assert.equal(count, 3);
    });

    test("Should return 0 if no reviews exist", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const count = await repo.countByUserId({
        userId: generateMockObjectId(),
      });

      assert.equal(count, 0);
    });
  });

  describe("Count Reviews By Product ID", () => {
    test("Should return the number (2) of all the reviews for a specific product", async () => {
      const mockProduct = generateMockProduct();
      const mockReviews = generateMockReviews(6);
      mockReviews[0].product = mockProduct._id;
      mockReviews[1].product = mockProduct._id;

      await Review.insertMany(mockReviews);

      const count = await repo.countByProductId({
        productId: mockProduct._id,
      });

      assert.equal(count, 2);
    });

    test("Should return 0 if no reviews exist", async () => {
      const mockReviews = generateMockReviews(4);
      await Review.insertMany(mockReviews);

      const count = await repo.countByProductId({
        productId: generateMockObjectId(),
      });

      assert.equal(count, 0);
    });
  });

  describe("Exists Review", () => {
    test("Should return value if review exists by review ID", async () => {
      const mockReview = generateMockReview();
      await Review.create(mockReview);

      const reviewExists = await repo.existsById({
        reviewId: mockReview._id,
      });

      assert.ok(reviewExists);
      assert.equal(reviewExists._id.toString(), mockReview._id.toString());
    });

    test("Should return null if review does not exist by review ID", async () => {
      const reviewExists = await repo.existsById({
        reviewId: generateMockObjectId(),
      });

      assert.equal(reviewExists, null);
    });

    test("Should return value if review exists by user ID and product ID", async () => {
      const mockProduct = generateMockProduct();
      const mockReview = generateMockReview();
      mockReview.product = mockProduct._id;

      await Review.create(mockReview);

      const reviewExists = await repo.existsByUserIdAndProductId({
        userId: mockReview.user,
        productId: mockProduct._id,
      });

      assert.ok(reviewExists);
      assert.equal(reviewExists._id.toString(), mockReview._id.toString());
    });

    test("Should return null if review does not exist by user ID and product ID", async () => {
      const reviewExists = await repo.existsByUserIdAndProductId({
        userId: generateMockObjectId(),
        productId: generateMockObjectId(),
      });

      assert.equal(reviewExists, null);
    });
  });
});
