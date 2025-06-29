import mongoose from "mongoose";
import assert from "node:assert/strict";
import { beforeEach, describe, mock, suite, test } from "node:test";
import {
  DatabaseNetworkError,
  DatabaseQueryError,
  DatabaseTimeoutError,
  DatabaseValidationError,
  GenericDatabaseError,
} from "../../errors";
import Review from "../../models/review.model";
import { ReviewRepository } from "../../repositories";
import { InsertReview } from "../../types";
import {
  generateMockObjectId,
  generateMockReview,
  generateMockReviews,
} from "../mocks";

suite("Review Repository 〖 Unit Tests 〗", () => {
  const repo = new ReviewRepository();

  beforeEach(() => mock.reset());

  describe("create", () => {
    const mockReview = generateMockReview();

    test("Should return review object when 'db.create' is called once with review data", async (t) => {
      const mockCreate = t.mock.method(Review, "create", () => ({
        toObject: () => mockReview,
      }));

      const review = await repo.create(mockReview);

      assert.ok(review);
      assert.deepStrictEqual(review, mockReview);

      assert.strictEqual(mockCreate.mock.callCount(), 1);
      assert.deepStrictEqual(mockCreate.mock.calls[0].arguments[0], mockReview);
    });

    test("Should throw 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "create", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.create(mockReview),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "create", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.create(mockReview),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "create", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.create(mockReview),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "create", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.create(mockReview),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "create", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create(mockReview),
        GenericDatabaseError,
      );
    });
  });

  describe("getAll", () => {
    const mockReviews = generateMockReviews(4);

    test("Should return array of reviews when 'db.find' is called once with no args", async (t) => {
      const findMock = t.mock.method(Review, "find", () => ({
        lean: async () => mockReviews,
      }));

      const reviews = await repo.getAll();

      assert.ok(reviews);
      assert.deepStrictEqual(reviews, mockReviews);

      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {});
    });

    test("Should return empty array when 'db.find' and returns empty array", async (t) => {
      t.mock.method(Review, "find", () => ({
        lean: async () => [],
      }));

      const reviews = await repo.getAll();

      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "find", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "find", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "find", () => {
        throw queryError;
      });

      await assert.rejects(async () => await repo.getAll(), DatabaseQueryError);
    });

    test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "find", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        GenericDatabaseError,
      );
    });
  });

  describe("getById", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;

    test("Should return review object when 'db.findById' is called once with 'reviewId'", async (t) => {
      const findByIdMock = t.mock.method(Review, "findById", () => ({
        lean: async () => mockReview,
      }));

      const review = await repo.getById({ reviewId });

      assert.ok(review);
      assert.deepStrictEqual(review, mockReview);

      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], reviewId);
    });

    test("Should return 'null' when 'db.findById' returns 'null'", async (t) => {
      t.mock.method(Review, "findById", () => ({
        lean: async () => null,
      }));

      const review = await repo.getById({ reviewId });

      assert.strictEqual(review, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "findById", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getById({ reviewId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "findById", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getById({ reviewId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "findById", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.getById({ reviewId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "findById", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getById({ reviewId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "findById", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getById({ reviewId }),
        GenericDatabaseError,
      );
    });
  });

  describe("getAllByUserId", () => {
    const mockReviews = generateMockReviews(5);
    const userId = mockReviews[0].user;

    test("Should return array of reviews when 'db.find' is called once with 'userId'", async (t) => {
      const findByIdMock = t.mock.method(Review, "find", () => ({
        lean: async () => mockReviews,
      }));

      const reviews = await repo.getAllByUserId({ userId });

      assert.ok(reviews);
      assert.deepStrictEqual(reviews, mockReviews);

      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], {
        user: userId,
      });
    });

    test("Should return empty array when 'db.find' returns empty array", async (t) => {
      t.mock.method(Review, "find", () => ({
        lean: async () => [],
      }));

      const reviews = await repo.getAllByUserId({ userId });

      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "find", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "find", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "find", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "find", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        GenericDatabaseError,
      );
    });
  });

  describe("getAllByProductId", () => {
    const mockReviews = generateMockReviews(5);
    const productId = mockReviews[0].product;

    test("Should return array of reviews when 'db.find' is called once with 'productId'", async (t) => {
      const findByIdMock = t.mock.method(Review, "find", () => ({
        lean: async () => mockReviews,
      }));

      const reviews = await repo.getAllByProductId({ productId });

      assert.ok(reviews);
      assert.deepStrictEqual(reviews, mockReviews);

      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], {
        product: productId,
      });
    });

    test("Should return empty array when 'db.find' returns empty array", async (t) => {
      t.mock.method(Review, "find", () => ({
        lean: async () => [],
      }));

      const reviews = await repo.getAllByProductId({ productId });

      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "find", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getAllByProductId({ productId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "find", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getAllByProductId({ productId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "find", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.getAllByProductId({ productId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "find", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getAllByProductId({ productId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAllByProductId({ productId }),
        GenericDatabaseError,
      );
    });
  });

  describe("update", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;
    const updateData: Partial<InsertReview> = { comment: "new-comment" };
    const expectedResult = { ...mockReview, ...updateData };

    test("Should return review object when 'db.findByIdAndUpdate' is called once with 'reviewId' and 'updateData'", async (t) => {
      const findByIdAndUpdateMock = t.mock.method(
        Review,
        "findByIdAndUpdate",
        () => ({
          lean: async () => expectedResult,
        }),
      );

      const updatedReview = await repo.update({ reviewId, data: updateData });

      assert.ok(updatedReview);
      assert.deepStrictEqual(updatedReview, expectedResult);

      assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[0],
        reviewId,
      );
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[1],
        updateData,
      );
    });

    test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
      t.mock.method(Review, "findByIdAndUpdate", () => ({
        lean: async () => null,
      }));

      const updatedReview = await repo.update({ reviewId, data: updateData });

      assert.strictEqual(updatedReview, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "findByIdAndUpdate", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.update({ reviewId, data: updateData }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "findByIdAndUpdate", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.update({ reviewId, data: updateData }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "findByIdAndUpdate", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.update({ reviewId, data: updateData }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "findByIdAndUpdate", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.update({ reviewId, data: updateData }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.update({ reviewId, data: updateData }),
        GenericDatabaseError,
      );
    });
  });

  describe("delete", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;

    test("Should return review object when 'db.findByIdAndDelete' is called once with'reviewId'", async (t) => {
      const findByIdAndDeleteMock = t.mock.method(
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

    test("Should return 'null' when 'db.findByIdAndDelete' returns 'null'", async (t) => {
      t.mock.method(Review, "findByIdAndDelete", () => ({
        lean: async () => null,
      }));

      const deletedReview = await repo.delete({ reviewId });

      assert.strictEqual(deletedReview, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findByIdAndDelete' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "findByIdAndDelete", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.delete({ reviewId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findByIdAndDelete' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "findByIdAndDelete", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.delete({ reviewId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findByIdAndDelete' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "findByIdAndDelete", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.delete({ reviewId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findByIdAndDelete' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "findByIdAndDelete", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.delete({ reviewId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findByIdAndDelete' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "findByIdAndDelete", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.delete({ reviewId }),
        GenericDatabaseError,
      );
    });
  });

  describe("count", () => {
    const mockCount = 5;

    test("Should return the count as number when 'db.countDocuments' is called once with no args", async (t) => {
      const countDocumentsMock = t.mock.method(
        Review,
        "countDocuments",
        () => ({
          lean: async () => mockCount,
        }),
      );

      const count = await repo.count();

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);

      assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        countDocumentsMock.mock.calls[0].arguments.length,
        0,
      );
    });

    test("Should return '0' when 'db.countDocuments' returns '0'", async (t) => {
      t.mock.method(Review, "countDocuments", () => ({
        lean: async () => 0,
      }));

      const count = await repo.count();

      assert.strictEqual(count, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "countDocuments", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.count(),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "countDocuments", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.count(),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "countDocuments", () => {
        throw queryError;
      });

      await assert.rejects(async () => await repo.count(), DatabaseQueryError);
    });

    test("Should throw 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "countDocuments", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.count(),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.count(),
        GenericDatabaseError,
      );
    });
  });

  describe("countByUserId", () => {
    const mockCount = 5;
    const userId = generateMockObjectId();

    test("Should return the count as number when 'db.countDocuments' is called once with 'userId' ", async (t) => {
      const countDocumentsMock = t.mock.method(
        Review,
        "countDocuments",
        () => ({
          lean: async () => mockCount,
        }),
      );

      const count = await repo.countByUserId({ userId });

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);

      assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
      assert.deepStrictEqual(countDocumentsMock.mock.calls[0].arguments[0], {
        user: userId,
      });
    });

    test("Should return '0' when 'db.countDocuments' returns '0'", async (t) => {
      t.mock.method(Review, "countDocuments", () => ({
        lean: async () => 0,
      }));

      const count = await repo.countByUserId({ userId });
      assert.strictEqual(count, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "countDocuments", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.countByUserId({ userId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "countDocuments", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.countByUserId({ userId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "countDocuments", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.countByUserId({ userId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "countDocuments", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.countByUserId({ userId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.countByUserId({ userId }),
        GenericDatabaseError,
      );
    });
  });

  describe("countByProductId", () => {
    const mockCount = 5;
    const productId = generateMockObjectId();

    test("Should return the count as number when 'db.countDocuments' is called once with 'productId'", async (t) => {
      const countDocumentsMock = t.mock.method(
        Review,
        "countDocuments",
        () => ({
          lean: async () => mockCount,
        }),
      );

      const count = await repo.countByProductId({ productId });

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);

      assert.strictEqual(countDocumentsMock.mock.callCount(), 1);
      assert.deepStrictEqual(countDocumentsMock.mock.calls[0].arguments[0], {
        product: productId,
      });
    });

    test("Should return '0' when 'db.countDocuments' returns '0'", async (t) => {
      t.mock.method(Review, "countDocuments", () => ({
        lean: async () => 0,
      }));

      const count = await repo.countByProductId({ productId });

      assert.strictEqual(count, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "countDocuments", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.countByProductId({ productId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "countDocuments", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.countByProductId({ productId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "countDocuments", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.countByProductId({ productId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "countDocuments", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.countByProductId({ productId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.countByProductId({ productId }),
        GenericDatabaseError,
      );
    });
  });

  describe("existsById", () => {
    const reviewId = generateMockObjectId();
    const expectedResult = { _id: reviewId };

    test("Should return the 'reviewId' when 'db.exists' is called once with 'reviewId'", async (t) => {
      const existsMock = t.mock.method(Review, "exists", () => ({
        lean: async () => expectedResult,
      }));

      const reviewExists = await repo.existsById({ reviewId });

      assert.ok(reviewExists);
      assert.deepStrictEqual(reviewExists, expectedResult);

      assert.strictEqual(existsMock.mock.callCount(), 1);
      assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], {
        _id: reviewId,
      });
    });

    test("Should return 'null' when 'db.exists' returns 'null'", async (t) => {
      t.mock.method(Review, "exists", () => ({
        lean: async () => null,
      }));

      const reviewExists = await repo.existsById({ reviewId });

      assert.strictEqual(reviewExists, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.exists' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "exists", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.existsById({ reviewId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.exists' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "exists", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.existsById({ reviewId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.exists' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "exists", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.existsById({ reviewId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.exists' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "exists", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.existsById({ reviewId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.exists' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "exists", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.existsById({ reviewId }),
        GenericDatabaseError,
      );
    });
  });

  describe("existsByUserIdAndProductId", () => {
    const userId = generateMockObjectId();
    const productId = generateMockObjectId();
    const reviewId = generateMockObjectId();
    const expectedResult = { _id: reviewId };

    test("Should return 'reviewId' when 'db.exists' is called once with 'userId' and 'productId'", async (t) => {
      const existsMock = t.mock.method(Review, "exists", () => ({
        lean: async () => expectedResult,
      }));

      const reviewExists = await repo.existsByUserIdAndProductId({
        userId,
        productId,
      });

      assert.ok(reviewExists);
      assert.deepStrictEqual(reviewExists, expectedResult);

      assert.strictEqual(existsMock.mock.callCount(), 1);
      assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], {
        user: userId,
        product: productId,
      });
    });

    test("Should return 'null' when 'db.exists' returns 'null'", async (t) => {
      t.mock.method(Review, "exists", () => ({
        lean: async () => null,
      }));

      const reviewExists = await repo.existsByUserIdAndProductId({
        userId,
        productId,
      });

      assert.strictEqual(reviewExists, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.exists' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Review, "exists", () => {
        throw validationError;
      });

      await assert.rejects(
        async () =>
          await repo.existsByUserIdAndProductId({ userId, productId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.exists' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Review, "exists", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () =>
          await repo.existsByUserIdAndProductId({ userId, productId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.exists' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Review, "exists", () => {
        throw queryError;
      });

      await assert.rejects(
        async () =>
          await repo.existsByUserIdAndProductId({ userId, productId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.exists' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Review, "exists", () => {
        throw networkError;
      });

      await assert.rejects(
        async () =>
          await repo.existsByUserIdAndProductId({ userId, productId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.exists' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "exists", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () =>
          await repo.existsByUserIdAndProductId({ userId, productId }),
        GenericDatabaseError,
      );
    });
  });
});
