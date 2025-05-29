import mongoose from "mongoose";
import assert from "node:assert/strict";
import { beforeEach, describe, mock, suite, test } from "node:test";
import { DatabaseError } from "../../errors";
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

      const review = await repo.create({ data: mockReview });

      assert.ok(review);
      assert.deepStrictEqual(review, mockReview);

      assert.strictEqual(mockCreate.mock.callCount(), 1);
      assert.deepStrictEqual(mockCreate.mock.calls[0].arguments[0], mockReview);
    });

    test("Should throw 'DatabaseError' when 'db.create' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "create", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.create({ data: mockReview }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.create' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "create", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create({ data: mockReview }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.find' throws a Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error("Query failed");

      t.mock.method(Review, "find", () => {
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

    test("Should throw generic 'DatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(async () => await repo.getAll(), DatabaseError);
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

    test("Should throw 'DatabaseError' when 'db.findById' throws a Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "findById", () => {
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

    test("Should throw generic 'DatabaseError' when 'db.findById' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "findById", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getById({ reviewId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.find' throws a Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "find", () => {
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

    test("Should throw generic 'DatabaseError' when 'Review.find({user: userId})' throws unknown errors", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'Review.find({product: productId})' throws a Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "find", () => {
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

    test("Should throw generic 'DatabaseError' when 'Review.find({product: productId})' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAllByProductId({ productId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'Review.findByIdAndUpdate' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "findByIdAndUpdate", () => {
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

    test("Should throw generic 'DatabaseError' when 'Review.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.update({ reviewId, data: updateData }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.findByIdAndDelete' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "findByIdAndDelete", () => {
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

    test("Should throw generic 'DatabaseError' when 'Review.findByIdAndDelete' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "findByIdAndDelete", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.delete({ reviewId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.countDocuments' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "countDocuments", () => {
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

    test("Should throw generic 'DatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(async () => await repo.count(), DatabaseError);
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

    test("Should throw 'DatabaseError' when 'db.countDocuments' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "countDocuments", () => {
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

    test("Should throw generic 'DatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.countByUserId({ userId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.countDocuments' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "countDocuments", () => {
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

    test("Should throw generic 'DatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.countByProductId({ productId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.exists' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "exists", () => {
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

    test("Should throw generic 'DatabaseError' when 'db.exists' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "exists", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.existsById({ reviewId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.exists' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Review, "exists", () => {
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

    test("Should throw generic 'DatabaseError' when 'db.exists' throws unknown error", async (t) => {
      const userId = generateMockObjectId();
      const productId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Review, "exists", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () =>
          await repo.existsByUserIdAndProductId({ userId, productId }),
        DatabaseError,
      );
    });
  });
});
