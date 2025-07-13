import { Types } from "mongoose";
import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import {
  DatabaseDuplicateKeyError,
  DatabaseValidationError,
} from "../../errors";
import Product from "../../models/productModel";
import Review from "../../models/review.model";
import { ReviewRepository } from "../../repositories";
import { InsertReview } from "../../types";
import { generateMockObjectId, generateMockSelectProduct } from "../mocks";
import {
  generateMockInsertReview,
  generateMockSelectReview,
  generateMockSelectReviews,
} from "../mocks/review.mock";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("Review Repository 〖 Integration Tests 〗", async () => {
  const reviewRepository = new ReviewRepository();

  before(async () => await connectTestDatabase());
  after(async () => await disconnectTestDatabase());
  beforeEach(async () => {
    await Review.deleteMany({});
    await Product.deleteMany({});
  });

  describe("create", () => {
    test("should create a review when 'create' is called with valid review data", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();

      // Act
      const createdReview = await reviewRepository.create(mockReview);

      // Assert
      assert.ok(createdReview._id, "Review should have an ID");
      assert.equal(createdReview.name, mockReview.name);
      assert.equal(createdReview.rating, mockReview.rating);
      assert.equal(createdReview.comment, mockReview.comment);
      assert.deepStrictEqual(createdReview.user, mockReview.user);
      assert.deepStrictEqual(createdReview.product, mockReview.product);
    });

    test("should throw 'DatabaseDuplicateKeyError' when 'create' is called with duplicate user-product combination", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      await reviewRepository.create(mockReview);

      // Act & Assert
      await assert.rejects(
        async () => await reviewRepository.create(mockReview),
        DatabaseDuplicateKeyError,
      );
    });
  });

  describe("getById", () => {
    test("should return review when 'getById' is called with existing review ID", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await reviewRepository.create(mockReview);

      // Act
      const retrievedReview = await reviewRepository.getById({
        reviewId: createdReview._id,
      });

      // Assert
      assert.ok(retrievedReview);
      assert.equal(retrievedReview.name, mockReview.name);
      assert.equal(retrievedReview.rating, mockReview.rating);
      assert.equal(retrievedReview.comment, mockReview.comment);
      assert.deepStrictEqual(retrievedReview.user, mockReview.user);
      assert.deepStrictEqual(retrievedReview.product, mockReview.product);
    });

    test("should return null when 'getById' is called with non-existent review ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act
      const review = await reviewRepository.getById({
        reviewId: nonExistentId,
      });

      // Assert
      assert.strictEqual(review, null);
    });

    test("should throw 'DatabaseValidationError' when 'getById' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () => await reviewRepository.getById({ reviewId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("getAll", () => {
    test("should return empty array when 'getAll' is called with no reviews in database", async () => {
      // Act
      const reviews = await reviewRepository.getAll();

      // Assert
      assert.deepStrictEqual(reviews, []);
    });

    test("should return all reviews when 'getAll' is called with multiple reviews in database", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      // Act
      const reviews = await reviewRepository.getAll();

      // Assert
      assert.equal(reviews.length, mockReviews.length);
      reviews.forEach((review) => {
        const mockReview = mockReviews.find(
          (mr) => mr._id.toString() === review._id.toString(),
        );
        assert.ok(
          mockReview,
          "Each returned review should match a mock review",
        );
      });
    });
  });

  describe("getAllByUserId", () => {
    test("should return user's reviews when 'getAllByUserId' is called with valid user ID", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({
        count: 3,
        options: { user: userId },
      });
      const otherReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany([...mockReviews, ...otherReviews]);

      // Act
      const reviews = await reviewRepository.getAllByUserId({ userId });

      // Assert
      assert.equal(reviews.length, mockReviews.length);
      reviews.forEach((review) => {
        assert.deepStrictEqual(
          review.user,
          userId,
          "Each review should belong to the specified user",
        );
      });
    });

    test("should return empty array when 'getAllByUserId' is called with user having no reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany(mockReviews);

      // Act
      const reviews = await reviewRepository.getAllByUserId({ userId });

      // Assert
      assert.deepStrictEqual(reviews, []);
    });

    test("should throw 'DatabaseValidationError' when 'getAllByUserId' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () =>
          await reviewRepository.getAllByUserId({ userId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("getAllByProductId", () => {
    test("should return product's reviews when 'getAllByProductId' is called with valid product ID", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({
        count: 3,
        options: { product: productId },
      });
      const otherReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany([...mockReviews, ...otherReviews]);

      // Act
      const reviews = await reviewRepository.getAllByProductId({ productId });

      // Assert
      assert.equal(reviews.length, mockReviews.length);
      reviews.forEach((review) => {
        assert.deepStrictEqual(
          review.product,
          productId,
          "Each review should belong to the specified product",
        );
      });
    });

    test("should return empty array when 'getAllByProductId' is called with product having no reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany(mockReviews);

      // Act
      const reviews = await reviewRepository.getAllByProductId({ productId });

      // Assert
      assert.deepStrictEqual(reviews, []);
    });

    test("should throw 'DatabaseValidationError' when 'getAllByProductId' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () =>
          await reviewRepository.getAllByProductId({ productId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("update", () => {
    test("should update review when 'update' is called with valid review ID and data", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await reviewRepository.create(mockReview);
      const updateData = {
        rating: 5,
        comment: "Updated comment",
      };

      // Act
      const updatedReview = await reviewRepository.update({
        reviewId: createdReview._id,
        data: updateData,
      });

      // Assert
      assert.ok(updatedReview);
      assert.equal(updatedReview.rating, updateData.rating);
      assert.equal(updatedReview.comment, updateData.comment);
      // Verify other fields remain unchanged
      assert.equal(updatedReview.name, mockReview.name);
      assert.deepStrictEqual(updatedReview.user, mockReview.user);
      assert.deepStrictEqual(updatedReview.product, mockReview.product);
    });

    test("should return null when 'update' is called with non-existent review ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();
      const updateData = { rating: 5, comment: "Updated comment" };

      // Act
      const updatedReview = await reviewRepository.update({
        reviewId: nonExistentId,
        data: updateData,
      });

      // Assert
      assert.strictEqual(updatedReview, null);
    });
  });

  describe("delete", () => {
    test("should delete review when 'delete' is called with existing review ID", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await reviewRepository.create(mockReview);

      // Act
      const deletedReview = await reviewRepository.delete({
        reviewId: createdReview._id,
      });

      // Assert
      assert.ok(deletedReview);
      assert.equal(deletedReview.name, mockReview.name);
      assert.equal(deletedReview.rating, mockReview.rating);
      assert.equal(deletedReview.comment, mockReview.comment);
      assert.deepStrictEqual(deletedReview.user, mockReview.user);
      assert.deepStrictEqual(deletedReview.product, mockReview.product);
      const reviewInDb = await Review.findById(createdReview._id).lean();
      assert.strictEqual(reviewInDb, null);
    });

    test("should return null when 'delete' is called with non-existent review ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act
      const deletedReview = await reviewRepository.delete({
        reviewId: nonExistentId,
      });

      // Assert
      assert.strictEqual(deletedReview, null);
    });

    test("should throw 'DatabaseValidationError' when 'delete' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () => await reviewRepository.delete({ reviewId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("count", () => {
    test("should return correct count when 'count' is called with reviews in database", async () => {
      // Arrange
      const mockReviews = generateMockSelectReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      // Act
      const count = await reviewRepository.count();

      // Assert
      assert.equal(count, mockReviews.length);
    });

    test("should return zero when 'count' is called with empty database", async () => {
      // Act
      const count = await reviewRepository.count();

      // Assert
      assert.equal(count, 0);
    });
  });

  describe("countByUserId", () => {
    test("should return correct count when 'countByUserId' is called with user having reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({
        count: 3,
        options: { user: userId },
      });
      const otherReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany([...mockReviews, ...otherReviews]);

      // Act
      const count = await reviewRepository.countByUserId({ userId });

      // Assert
      assert.equal(count, mockReviews.length);
    });

    test("should return zero when 'countByUserId' is called with user having no reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();
      // Add some reviews by other users
      await Review.insertMany(generateMockSelectReviews({ count: 2 }));

      // Act
      const count = await reviewRepository.countByUserId({ userId });

      // Assert
      assert.equal(count, 0);
    });

    test("should throw 'DatabaseValidationError' when 'countByUserId' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () => await reviewRepository.countByUserId({ userId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("countByProductId", () => {
    test("should return correct count when 'countByProductId' is called with product having reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockSelectReviews({
        count: 3,
        options: { product: productId },
      });
      const otherReviews = generateMockSelectReviews({ count: 2 });
      await Review.insertMany([...mockReviews, ...otherReviews]);

      // Act
      const count = await reviewRepository.countByProductId({ productId });

      // Assert
      assert.equal(count, mockReviews.length);
    });

    test("should return zero when 'countByProductId' is called with product having no reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      // Add some reviews for other products
      await Review.insertMany(generateMockSelectReviews({ count: 2 }));

      // Act
      const count = await reviewRepository.countByProductId({ productId });

      // Assert
      assert.equal(count, 0);
    });

    test("should throw 'DatabaseValidationError' when 'countByProductId' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () =>
          await reviewRepository.countByProductId({ productId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("existsById", () => {
    test("should return review ID when 'existsById' is called with existing review ID", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await reviewRepository.create(mockReview);

      // Act
      const result = await reviewRepository.existsById({
        reviewId: createdReview._id,
      });

      // Assert
      assert.ok(result);
      assert.deepStrictEqual(result._id, createdReview._id);
    });

    test("should return null when 'existsById' is called with non-existent review ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act
      const result = await reviewRepository.existsById({
        reviewId: nonExistentId,
      });

      // Assert
      assert.strictEqual(result, null);
    });

    test("should throw 'DatabaseValidationError' when 'existsById' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () => await reviewRepository.existsById({ reviewId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("existsByUserIdAndProductId", () => {
    test("should return review ID when 'existsByUserIdAndProductId' is called with existing combination", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await reviewRepository.create(mockReview);

      // Act
      const result = await reviewRepository.existsByUserIdAndProductId({
        userId: mockReview.user,
        productId: mockReview.product,
      });

      // Assert
      assert.ok(result);
      assert.deepStrictEqual(result._id, createdReview._id);
    });

    test("should return null when 'existsByUserIdAndProductId' is called with non-existent combination", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const productId = generateMockObjectId();

      // Act
      const result = await reviewRepository.existsByUserIdAndProductId({
        userId,
        productId,
      });

      // Assert
      assert.strictEqual(result, null);
    });

    test("should throw 'DatabaseValidationError' when 'existsByUserIdAndProductId' is called with invalid ObjectIds", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () =>
          await reviewRepository.existsByUserIdAndProductId({
            userId: invalidId,
            productId: generateMockObjectId(),
          }),
        DatabaseValidationError,
      );

      await assert.rejects(
        async () =>
          await reviewRepository.existsByUserIdAndProductId({
            userId: generateMockObjectId(),
            productId: invalidId,
          }),
        DatabaseValidationError,
      );
    });
  });

  describe("Side Effects", () => {
    test("should update product rating and numReviews when review is created", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      const productId = mockProduct._id;
      const mockReview = generateMockInsertReview({
        product: productId,
        rating: 4,
      });
      await Product.create(mockProduct);

      // Act
      await reviewRepository.create(mockReview);

      // Assert
      const updatedProduct = await Product.findById(productId).lean();
      assert.ok(updatedProduct);
      assert.equal(updatedProduct.rating, 4.0);
      assert.equal(updatedProduct.numReviews, 1);
    });

    test("should update product rating and numReviews when review is updated", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      const productId = mockProduct._id;
      const mockReview = generateMockSelectReview({
        product: productId,
        rating: 4,
      });
      const updateData: Partial<InsertReview> = { rating: 5 };
      await Product.create(mockProduct);
      await reviewRepository.create(mockReview);

      // Act
      await reviewRepository.update({
        reviewId: mockReview._id,
        data: updateData,
      });

      // Assert
      const updatedProduct = await Product.findById(productId).lean();
      assert.ok(updatedProduct);
      assert.equal(updatedProduct.rating, updateData.rating);
      assert.equal(updatedProduct.numReviews, 1);
    });

    test("should update product rating and numReviews when review is deleted", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      const productId = mockProduct._id;
      const mockReview = generateMockSelectReview({
        product: productId,
        rating: 4,
      });
      await Product.create(mockProduct);
      await Review.create(mockReview);

      // Act
      await reviewRepository.delete({ reviewId: mockReview._id });

      // Assert
      const updatedProduct = await Product.findById(productId).lean();
      assert.ok(updatedProduct);
      assert.equal(updatedProduct.rating, 0);
      assert.equal(updatedProduct.numReviews, 0);
    });
  });
});
