import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { DatabaseDuplicateKeyError, NotFoundError } from "../../errors";
import Product from "../../models/productModel";
import Review from "../../models/review.model";
import User from "../../models/userModel";
import { ReviewService } from "../../services/review.service";
import { InsertReview } from "../../types";
import {
  generateMockInsertProductWithStringImage,
  generateMockInsertReview,
  generateMockInsertReviews,
  generateMockObjectId,
  generateMockSelectProduct,
} from "../mocks";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("Review Service 〖 Integration Tests 〗", () => {
  const reviewService = new ReviewService();

  function calculateAvgRating(reviews: Array<InsertReview>): number {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const avg = sum / reviews.length;
    const float = parseFloat(avg.toFixed(1));
    return float;
  }

  before(async () => connectTestDatabase());
  after(async () => disconnectTestDatabase());
  beforeEach(async () => {
    await Review.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
  });

  describe("create", () => {
    test("Should create a new review when 'repo.create' is called with valid review data", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();

      // Act
      const review = await reviewService.create(mockReview);

      // Assert
      assert.ok(review);
      assert.strictEqual(review.name, mockReview.name);
      assert.strictEqual(review.rating, mockReview.rating);
      assert.strictEqual(review.comment, mockReview.comment);
      assert.strictEqual(review.user.toString(), mockReview.user.toString());
      assert.strictEqual(
        review.product.toString(),
        mockReview.product.toString(),
      );
    });

    test("Should update product 'rating' and 'numReviews' when 'repo.create' is called with valid review data", async () => {
      // Arrange
      const mockProduct = generateMockInsertProductWithStringImage();
      const product = await Product.create(mockProduct);
      const mockReview = generateMockInsertReview({ product: product._id });

      // Act
      await reviewService.create(mockReview);

      // Assert
      const updatedProduct = await Product.findById(product._id);
      assert.ok(updatedProduct);
      assert.strictEqual(updatedProduct.rating, mockReview.rating);
      assert.strictEqual(updatedProduct.numReviews, 1);
    });

    test("Should update the product 'rating' and 'numReviews' when 'repo.create' is called multiple times with valid review data", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      const mockReviews = generateMockInsertReviews({
        count: 3,
        options: { product: mockProduct._id },
      });

      await Product.create(mockProduct);

      // Act
      await Promise.all(
        mockReviews.map(async (review) => await reviewService.create(review)),
      );

      // Assert
      const updatedProduct = await Product.findById(mockProduct._id);
      assert.ok(updatedProduct);
      assert.strictEqual(updatedProduct.numReviews, mockReviews.length);
      assert.strictEqual(
        updatedProduct.rating,
        calculateAvgRating(mockReviews),
      );
    });

    test("Should throw 'DatabaseDuplicateKeyError' when 'repo.create' is called with duplicate user-product review", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      await reviewService.create(mockReview);

      // Act & Assert
      await assert.rejects(async () => {
        await reviewService.create(mockReview); //same user-product review
      }, DatabaseDuplicateKeyError);
    });
  });

  describe("getById", () => {
    test("Should return review when 'repo.getById' is called with valid review ID", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await reviewService.create(mockReview);

      // Act
      const result = await reviewService.getById({
        reviewId: createdReview._id,
      });

      // Assert
      assert.strictEqual(result.name, mockReview.name);
      assert.strictEqual(result.rating, mockReview.rating);
      assert.strictEqual(result.comment, mockReview.comment);
      assert.deepStrictEqual(result.user, mockReview.user);
      assert.deepStrictEqual(result.product, mockReview.product);
    });

    test("Should throw 'NotFoundError' when 'repo.getById' is called with non-existent review ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(async () => {
        await reviewService.getById({ reviewId: nonExistentId });
      }, NotFoundError);
    });
  });

  describe("getAll", () => {
    test("Should return all reviews when 'repo.getAll' is called with multiple reviews in database", async () => {
      // Arrange
      const mockReviews = generateMockInsertReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      // Act
      const results = await reviewService.getAll();

      // Assert
      assert(Array.isArray(results));
      assert.strictEqual(results.length, mockReviews.length);
      results.forEach((result, index) => {
        const review = mockReviews[index];
        assert.ok(result._id);
        assert.ok(result.createdAt);
        assert.ok(result.updatedAt);
        assert.strictEqual(result.user.toString(), review.user.toString());
        assert.strictEqual(
          result.product.toString(),
          review.product.toString(),
        );
        assert.strictEqual(result.name, review.name);
        assert.strictEqual(result.rating, review.rating);
        assert.strictEqual(result.comment, review.comment);
      });
    });

    test("Should return empty array when 'repo.getAll' is called with no reviews in database", async () => {
      // Act
      const results = await reviewService.getAll();

      // Assert
      assert(Array.isArray(results));
      assert.strictEqual(results.length, 0);
    });
  });

  describe("getAllByUserId", () => {
    test("Should return all user reviews when 'repo.getAllByUserId' is called with user having multiple reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const mockReviews = generateMockInsertReviews({
        count: 3,
        options: { user: userId },
      });
      const otherReviews = generateMockInsertReviews({
        count: 3,
      });
      await Review.insertMany([...mockReviews, ...otherReviews]);

      // Act
      const results = await reviewService.getAllByUserId({ userId });

      // Assert
      assert(Array.isArray(results));
      assert.strictEqual(results.length, mockReviews.length);

      // Verify all reviews belong to the user
      results.forEach((result) => {
        assert.deepStrictEqual(result.user.toString(), userId.toString());
      });
    });

    test("Should return empty array when 'repo.getAllByUserId' is called with user having no reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();

      // Act
      const results = await reviewService.getAllByUserId({ userId });

      // Assert
      assert(Array.isArray(results));
      assert.strictEqual(results.length, 0);
    });
  });

  describe("getAllByProductId", () => {
    test("Should return all product reviews when 'repo.getAllByProductId' is called with product having multiple reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockInsertReviews({
        count: 3,
        options: { product: productId },
      });
      const otherReviews = generateMockInsertReviews({ count: 3 });
      await Review.insertMany([...mockReviews, ...otherReviews]);

      // Act
      const results = await reviewService.getAllByProductId({ productId });

      // Assert
      assert(Array.isArray(results));
      assert.strictEqual(results.length, mockReviews.length);

      // Verify all reviews belong to the product
      results.forEach((result) => {
        assert.deepStrictEqual(result.product.toString(), productId.toString());
      });
    });

    test("Should return empty array when 'repo.getAllByProductId' is called with product having no reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockInsertReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      // Act
      const results = await reviewService.getAllByProductId({ productId });

      // Assert
      assert(Array.isArray(results));
      assert.strictEqual(results.length, 0);
    });
  });

  describe("update", () => {
    test("Should update review when 'repo.update' is called with valid review ID and data", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await Review.create(mockReview);
      const updateData: Partial<InsertReview> = {
        name: "Updated Name",
        comment: "Updated Comment",
      };

      // Act
      const result = await reviewService.update({
        reviewId: createdReview._id,
        data: updateData,
      });

      // Assert
      assert.strictEqual(result.name, updateData.name);
      assert.strictEqual(result.comment, updateData.comment);

      // Ensure other fields are unchanged
      assert.strictEqual(result.rating, mockReview.rating);
      assert.strictEqual(result.user.toString(), mockReview.user.toString());
      assert.strictEqual(
        result.product.toString(),
        mockReview.product.toString(),
      );
    });

    test("Should update product 'rating' when 'repo.update' is called with new rating value", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await Product.create(mockProduct);

      const mockReview = generateMockInsertReview({
        product: mockProduct._id,
        rating: 3,
      });
      const createdReview = await reviewService.create(mockReview);

      const updateData = { rating: 5 };
      const updatedMock = { ...mockReview, ...updateData };
      const updatedRating = calculateAvgRating([updatedMock]);

      // Act
      await reviewService.update({
        reviewId: createdReview._id,
        data: updateData,
      });

      // Assert
      const updatedProduct = await Product.findById(mockReview.product);
      assert.ok(updatedProduct);
      assert.strictEqual(updatedProduct.numReviews, 1);
      assert.strictEqual(updatedProduct.rating, updatedRating);
    });

    test("Should throw 'NotFoundError' when 'repo.update' is called with non-existent review ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();
      const updateData = { name: "Updated Name" };

      // Act & Assert
      await assert.rejects(async () => {
        await reviewService.update({
          reviewId: nonExistentId,
          data: updateData,
        });
      }, NotFoundError);
    });
  });

  describe("delete", () => {
    test("Should delete review when 'repo.delete' is called with valid review ID", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await Review.create(mockReview);

      // Act
      const result = await reviewService.delete({
        reviewId: createdReview._id,
      });

      // Assert
      assert.strictEqual(result.name, mockReview.name);
      assert.strictEqual(result.rating, mockReview.rating);
      assert.strictEqual(result.comment, mockReview.comment);
      assert.deepStrictEqual(result.user, mockReview.user);
      assert.deepStrictEqual(result.product, mockReview.product);

      // Verify review is actually deleted
      const deletedReview = await Review.findById(createdReview._id);
      assert.strictEqual(deletedReview, null);
    });

    test("Should update product 'rating' and 'numReviews' when 'repo.delete' is called with valid review ID", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await Product.create(mockProduct);

      const mockReview = generateMockInsertReview({
        product: mockProduct._id,
      });
      const createdReview = await reviewService.create(mockReview);

      // Act
      await reviewService.delete({ reviewId: createdReview._id });

      // Assert
      const updatedProduct = await Product.findById(mockReview.product);
      assert.ok(updatedProduct);
      assert.strictEqual(updatedProduct.rating, 0);
      assert.strictEqual(updatedProduct.numReviews, 0);
    });

    test("Should throw 'NotFoundError' when 'repo.delete' is called with non-existent review ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(async () => {
        await reviewService.delete({ reviewId: nonExistentId });
      }, NotFoundError);
    });
  });

  describe("count", () => {
    test("Should return correct count when 'repo.count' is called with multiple reviews in database", async () => {
      // Arrange
      const mockReviews = generateMockInsertReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      // Act
      const count = await reviewService.count();

      // Assert
      assert.strictEqual(count, mockReviews.length);
    });

    test("Should return 0 when 'repo.count' is called with no reviews in database", async () => {
      // Act
      const count = await reviewService.count();

      // Assert
      assert.strictEqual(count, 0);
    });
  });

  describe("countByUserId", () => {
    test("Should return correct count when 'repo.countByUserId' is called with user having multiple reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const mockReviews = generateMockInsertReviews({
        count: 3,
        options: { user: userId },
      });
      const otherReviews = generateMockInsertReviews({ count: 3 });
      await Review.insertMany([...mockReviews, ...otherReviews]);

      // Act
      const count = await reviewService.countByUserId({ userId });

      // Assert
      assert.strictEqual(count, mockReviews.length);
    });

    test("Should return 0 when 'repo.countByUserId' is called with user having no reviews", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const mockReviews = generateMockInsertReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      // Act
      const count = await reviewService.countByUserId({ userId });

      // Assert
      assert.strictEqual(count, 0);
    });
  });

  describe("countByProductId", () => {
    test("Should return correct count when 'repo.countByProductId' is called with product having multiple reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockInsertReviews({
        count: 3,
        options: { product: productId },
      });
      const otherReviews = generateMockInsertReviews({ count: 3 });
      await Review.insertMany([...mockReviews, ...otherReviews]);

      // Act
      const count = await reviewService.countByProductId({ productId });

      // Assert
      assert.strictEqual(count, mockReviews.length);
    });

    test("Should return 0 when 'repo.countByProductId' is called with product having no reviews", async () => {
      // Arrange
      const productId = generateMockObjectId();
      const mockReviews = generateMockInsertReviews({ count: 3 });
      await Review.insertMany(mockReviews);

      // Act
      const count = await reviewService.countByProductId({ productId });

      // Assert
      assert.strictEqual(count, 0);
    });
  });

  describe("existsById", () => {
    test("Should return review ID when 'repo.existsById' is called with existing review ID", async () => {
      // Arrange
      const mockReview = generateMockInsertReview();
      const createdReview = await Review.create(mockReview);

      // Act
      const result = await reviewService.existsById({
        reviewId: createdReview._id,
      });

      // Assert
      assert.ok(result._id);
      assert.deepStrictEqual(result._id, createdReview._id);
    });

    test("Should throw 'NotFoundError' when 'repo.existsById' is called with non-existent review ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(async () => {
        await reviewService.existsById({ reviewId: nonExistentId });
      }, NotFoundError);
    });
  });

  describe("existsByUserIdAndProductId", () => {
    test("Should return review ID when 'repo.existsByUserIdAndProductId' is called with existing user-product review", async () => {
      // Arrange
      const mockReviews = generateMockInsertReviews({ count: 3 });
      const createdReview = await Review.insertMany(mockReviews);

      // Act
      const result = await reviewService.existsByUserIdAndProductId({
        userId: mockReviews[0].user,
        productId: mockReviews[0].product,
      });

      // Assert
      assert.ok(result._id);
      assert.strictEqual(
        result._id.toString(),
        createdReview[0]._id.toString(),
      );
    });

    test("Should throw 'NotFoundError' when 'repo.existsByUserIdAndProductId' is called with non-existent user-product review", async () => {
      // Arrange
      const userId = generateMockObjectId();
      const productId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(async () => {
        await reviewService.existsByUserIdAndProductId({
          userId,
          productId,
        });
      }, NotFoundError);
    });
  });
});
