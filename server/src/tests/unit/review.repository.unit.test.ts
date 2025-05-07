import mongoose from "mongoose";
import assert from "node:assert/strict";
import { afterEach, describe, mock, suite, test } from "node:test";
import { DatabaseError } from "../../errors";
import Review from "../../models/review.model";
import { reviewRepository } from "../../repositories";
import { InsertReview } from "../../types";
import {
  generateMockObjectId,
  generateMockReview,
  generateMockReviews,
} from "../mocks";

suite("Review Repository 〖 Unit Tests 〗", () => {
  const repo = reviewRepository;
  afterEach(() => mock.reset());

  describe("Create Review", () => {
    test("Should return the created review object when 'Review.create' is called", async () => {
      const mockReview = generateMockReview();

      const createMock = mock.method(Review, "create", async () => ({
        toObject: () => mockReview,
      }));

      const review = await repo.create({ data: mockReview });

      assert.ok(review);
      assert.deepStrictEqual(review, mockReview);
      assert.strictEqual(createMock.mock.callCount(), 1);
      assert.deepStrictEqual(createMock.mock.calls[0].arguments[0], mockReview);
    });

    test("Should throw 'DatabaseError' when 'Review.create' throws duplicate key error", async () => {
      const mockReview = generateMockReview();
      const mongoError = new mongoose.mongo.MongoError(
        "E11000 duplicate key error",
      );
      mongoError.code = 11000;

      mock.method(Review, "create", () => {
        throw mongoError;
      });

      await assert.rejects(
        async () => await repo.create({ data: mockReview }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongoError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' when 'Review.create' throws Mongoose error", async () => {
      const mockReview = generateMockReview();
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      mock.method(Review, "create", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.create({ data: mockReview }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.create' throws unknown error", async () => {
      const mockReview = generateMockReview();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "create", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create({ data: mockReview }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve Reviews", () => {
    test("Should return array of all reviews when 'Review.find({})' is called", async () => {
      const mockReviews = generateMockReviews(4);

      const findMock = mock.method(Review, "find", () => ({
        lean: async () => mockReviews,
      }));

      const reviews = await repo.getAll();

      assert.ok(reviews);
      assert.strictEqual(reviews.length, mockReviews.length);
      assert.deepStrictEqual(reviews, mockReviews);
      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {});
    });

    test("Should return empty array when 'Review.find' returns empty array", async () => {
      mock.method(Review, "find", () => ({
        lean: async () => [],
      }));

      const reviews = await repo.getAll();

      assert.ok(reviews);
      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseError' when 'Review.find' throws a Mongoose error", async () => {
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(Review, "find", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.find' throws unknown error", async () => {
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve Review By ID", () => {
    test("Should return the review object when 'Review.findById' is called", async () => {
      const mockReview = generateMockReview();
      const reviewId = mockReview._id;

      const findByIdMock = mock.method(Review, "findById", () => ({
        lean: async () => mockReview,
      }));

      const review = await repo.getById({ reviewId });

      assert.ok(review);
      assert.deepStrictEqual(review, mockReview);
      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], reviewId);
    });

    test("Should return 'null' when 'Review.findById' returns 'null'", async () => {
      const reviewId = generateMockObjectId();

      mock.method(Review, "findById", () => ({
        lean: async () => null,
      }));

      const review = await repo.getById({ reviewId });

      assert.strictEqual(review, null);
    });

    test("Should throw 'DatabaseError' when 'Review.findById' throws a Mongoose error", async () => {
      const reviewId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(Review, "findById", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.getById({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.findById' throws unknown error", async () => {
      const reviewId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "findById", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getById({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve Reviews By User ID", () => {
    test("Should return array of all reviews for a specific user when 'Review.find({user: userId})' is called", async () => {
      const userId = generateMockObjectId();
      const mockReviews = generateMockReviews(2).map((review) => ({
        ...review,
        user: userId,
      }));

      const findByIdMock = mock.method(Review, "find", () => ({
        lean: async () => mockReviews,
      }));

      const reviews = await repo.getAllByUserId({ userId });

      assert.ok(reviews);
      assert.strictEqual(reviews.length, mockReviews.length);
      assert.deepStrictEqual(reviews, mockReviews);
      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], {
        user: userId,
      });
    });

    test("Should return empty array when 'Review.find({user: userId})' returns empty array", async () => {
      const userId = generateMockObjectId();

      mock.method(Review, "find", () => ({
        lean: async () => [],
      }));

      const reviews = await repo.getAllByUserId({ userId });

      assert.ok(reviews);
      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseError' when 'Review.find({user: userId})' throws a Mongoose error", async () => {
      const userId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(Review, "find", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.find({user: userId})' throws unknown errors", async () => {
      const userId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve Reviews By Product ID", () => {
    test("Should return array of all reviews for a specific product when 'Review.find({product: productId})' is called", async () => {
      const productId = generateMockObjectId();
      const mockReviews = generateMockReviews(3).map((review) => ({
        ...review,
        product: productId,
      }));

      const findByIdMock = mock.method(Review, "find", () => ({
        lean: async () => mockReviews,
      }));

      const reviews = await repo.getAllByProductId({ productId });

      assert.ok(reviews);
      assert.strictEqual(reviews.length, mockReviews.length);
      assert.deepStrictEqual(reviews, mockReviews);
      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], {
        product: productId,
      });
    });

    test("Should return empty array when 'Review.find({product: productId})' returns empty array", async () => {
      const productId = generateMockObjectId();

      mock.method(Review, "find", () => ({
        lean: async () => [],
      }));

      const reviews = await repo.getAllByProductId({ productId });

      assert.ok(reviews);
      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseError' when 'Review.find({product: productId})' throws a Mongoose error", async () => {
      const productId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(Review, "find", () => {
        throw mongooseError;
      });
      await assert.rejects(
        async () => await repo.getAllByProductId({ productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.find({product: productId})' throws unknown error", async () => {
      const productId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAllByProductId({ productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Update Review", () => {
    test("Should return the updated review object when 'Review.findByIdAndUpdate' is called", async () => {
      const mockReview = generateMockReview();
      const reviewId = mockReview._id;
      const updatedData: Partial<InsertReview> = { comment: "RANDOM_COMMENT" };
      const updatedMockReview = { ...mockReview, ...updatedData };

      const findByIdAndUpdateMock = mock.method(
        Review,
        "findByIdAndUpdate",
        () => ({
          lean: async () => updatedMockReview,
        }),
      );

      const updatedReview = await repo.update({ reviewId, data: updatedData });

      assert.ok(updatedReview);
      assert.deepStrictEqual(updatedReview, updatedMockReview);
      assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[0],
        reviewId,
      );
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[1],
        updatedData,
      );
      assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[2], {
        new: true,
      });
    });

    test("Should return 'null' when 'Review.findByIdAndUpdate' returns 'null'", async () => {
      const reviewId = generateMockObjectId();
      const updatedData: Partial<InsertReview> = { comment: "RANDOM_COMMENT" };

      mock.method(Review, "findByIdAndUpdate", () => ({
        lean: async () => null,
      }));

      const updatedReview = await repo.update({ reviewId, data: updatedData });

      assert.strictEqual(updatedReview, null);
    });

    test("Should throw 'DatabaseError' when 'Review.findByIdAndUpdate' throws Mongoose error", async () => {
      const reviewId = generateMockObjectId();
      const updateData: Partial<InsertReview> = { comment: "Updated Comment" };
      const mongooseError = new mongoose.Error("Update failed");

      mock.method(Review, "findByIdAndUpdate", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.update({ reviewId, data: updateData }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.findByIdAndUpdate' throws unknown error", async () => {
      const reviewId = generateMockObjectId();
      const updateData: Partial<InsertReview> = { comment: "Updated Comment" };
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.update({ reviewId, data: updateData }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Delete Review", () => {
    test("Should return the deleted review object when 'Review.findByIdAndDelete' is called", async () => {
      const mockReview = generateMockReview();
      const reviewId = mockReview._id;

      const findByIdAndDeleteMock = mock.method(
        Review,
        "findByIdAndDelete",
        () => ({
          lean: async () => mockReview,
        }),
      );

      const deletedReview = await repo.delete({ reviewId });

      assert.ok(deletedReview);
      assert.deepStrictEqual(deletedReview, mockReview);
      assert.strictEqual(findByIdAndDeleteMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        findByIdAndDeleteMock.mock.calls[0].arguments[0],
        reviewId,
      );
    });

    test("Should return 'null' when 'Review.findByIdAndDelete' returns 'null'", async () => {
      const reviewId = generateMockObjectId();

      mock.method(Review, "findByIdAndDelete", () => ({
        lean: async () => null,
      }));

      const deletedReview = await repo.delete({ reviewId });

      assert.strictEqual(deletedReview, null);
    });

    test("Should throw 'DatabaseError' when 'Review.findByIdAndDelete' throws Mongoose error", async () => {
      const reviewId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Delete failed");

      mock.method(Review, "findByIdAndDelete", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.delete({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.findByIdAndDelete' throws unknown error", async () => {
      const reviewId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "findByIdAndDelete", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.delete({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Count Reviews", () => {
    test("Should return the count as number when 'Review.countDocuments' is called", async () => {
      const mockCount = 10;

      const countDocumentsMock = mock.method(Review, "countDocuments", () => ({
        lean: async () => mockCount,
      }));

      const count = await repo.count();

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);
      assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        countDocumentsMock.mock.calls[0].arguments[0],
        undefined,
      );
    });

    test("Should return '0' when 'Review.countDocuments' returns '0'", async () => {
      mock.method(Review, "countDocuments", () => ({
        lean: async () => 0,
      }));

      const count = await repo.count();

      assert.strictEqual(count, 0);
    });

    test("Should throw 'DatabaseError' when 'Review.countDocuments' throws Mongoose error", async () => {
      const mongooseError = new mongoose.Error("Count failed");

      mock.method(Review, "countDocuments", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.count(),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.countDocuments' throws unknown error", async () => {
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.count(),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Count Reviews By User ID", () => {
    test("Should return the count as number when 'Review.countDocuments({user: userId})' is called", async () => {
      const userId = generateMockObjectId();
      const mockCount = 5;

      const countDocumentsMock = mock.method(Review, "countDocuments", () => ({
        lean: async () => mockCount,
      }));

      const count = await repo.countByUserId({ userId });

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);
      assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
      assert.deepStrictEqual(countDocumentsMock.mock.calls[0].arguments[0], {
        user: userId,
      });
    });

    test("Should return '0' when 'Review.countDocuments({user: userId})' returns '0'", async () => {
      const userId = generateMockObjectId();

      mock.method(Review, "countDocuments", () => ({
        lean: async () => 0,
      }));

      const count = await repo.countByUserId({ userId });
      assert.strictEqual(count, 0);
    });

    test("Should throw 'DatabaseError' when 'Review.countDocuments({user: userId})' throws Mongoose error", async () => {
      const userId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Count failed");

      mock.method(Review, "countDocuments", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.countByUserId({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.countDocuments({user: userId})' throws unknown error", async () => {
      const userId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.countByUserId({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Count Reviews By User ID", () => {
    test("Should return the count as number when 'Review.countDocuments({user: userId})' is called", async () => {
      const productId = generateMockObjectId();
      const mockCount = 5;

      const countDocumentsMock = mock.method(Review, "countDocuments", () => ({
        lean: async () => mockCount,
      }));

      const count = await repo.countByProductId({ productId });

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);
      assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
      assert.deepStrictEqual(countDocumentsMock.mock.calls[0].arguments[0], {
        product: productId,
      });
    });

    test("Should return '0' when 'Review.countDocuments({product: productId})' returns '0'", async () => {
      const productId = generateMockObjectId();

      mock.method(Review, "countDocuments", () => ({
        lean: async () => 0,
      }));

      const count = await repo.countByProductId({ productId });
      assert.strictEqual(count, 0);
    });

    test("Should throw 'DatabaseError' when 'Review.countDocuments({product: productId})' throws Mongoose error", async () => {
      const productId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Count failed");

      mock.method(Review, "countDocuments", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.countByProductId({ productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.countDocuments({product: productId})' throws unknown error", async () => {
      const productId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.countByProductId({ productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Review Exists By ID", () => {
    test("Should return the review ID when 'Review.exists({_id: reviewId})' is called", async () => {
      const reviewId = generateMockObjectId();
      const existsResult = { _id: reviewId };

      const existsMock = mock.method(Review, "exists", () => ({
        lean: async () => existsResult,
      }));

      const reviewExists = await repo.existsById({ reviewId });

      assert.ok(reviewExists);
      assert.deepStrictEqual(reviewExists, existsResult);
      assert.strictEqual(existsMock.mock.callCount(), 1);
      assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], {
        _id: reviewId,
      });
    });

    test("Should return 'null' when 'Review.exists({_id: reviewId})' returns 'null'", async () => {
      const reviewId = generateMockObjectId();

      mock.method(Review, "exists", () => ({
        lean: async () => null,
      }));

      const reviewExists = await repo.existsById({ reviewId });

      assert.strictEqual(reviewExists, null);
    });

    test("Should throw 'DatabaseError' when 'Review.exists({_id: reviewId})' throws Mongoose error", async () => {
      const reviewId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Exists failed");

      mock.method(Review, "exists", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.existsById({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.exists({_id: reviewId})' throws unknown error", async () => {
      const reviewId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "exists", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.existsById({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Review Exists By User ID and Product ID", () => {
    test("Should return the review ID when 'Review.exists({user: userId, product: productId})' is called", async () => {
      const userId = generateMockObjectId();
      const productId = generateMockObjectId();
      const reviewId = generateMockObjectId();
      const existsResult = { _id: reviewId };

      const existsMock = mock.method(Review, "exists", () => ({
        lean: async () => existsResult,
      }));

      const reviewExists = await repo.existsByUserIdAndProductId({
        userId,
        productId,
      });

      assert.ok(reviewExists);
      assert.deepStrictEqual(reviewExists, existsResult);
      assert.strictEqual(existsMock.mock.callCount(), 1);
      assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], {
        user: userId,
        product: productId,
      });
    });

    test("Should return 'null' when 'Review.exists({user: userId, product: productId})' returns 'null'", async () => {
      const userId = generateMockObjectId();
      const productId = generateMockObjectId();

      mock.method(Review, "exists", () => ({
        lean: async () => null,
      }));

      const reviewExists = await repo.existsByUserIdAndProductId({
        userId,
        productId,
      });

      assert.strictEqual(reviewExists, null);
    });

    test("Should throw 'DatabaseError' when 'Review.exists({user: userId, product: productId})' throws Mongoose error", async () => {
      const userId = generateMockObjectId();
      const productId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Exists failed");

      mock.method(Review, "exists", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () =>
          await repo.existsByUserIdAndProductId({ userId, productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.exists({user: userId, product: productId})' throws unknown error", async () => {
      const userId = generateMockObjectId();
      const productId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Review, "exists", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () =>
          await repo.existsByUserIdAndProductId({ userId, productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });
});
