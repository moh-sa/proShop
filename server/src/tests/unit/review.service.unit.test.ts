import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { NotFoundError } from "../../errors";
import { ReviewService } from "../../services";
import { InsertReview } from "../../types";
import {
  generateMockObjectId,
  generateMockReview,
  generateMockReviews,
  mockReviewRepository,
} from "../mocks";

suite("Review Service 〖 Unit Tests 〗", () => {
  const mockRepo = mockReviewRepository();
  const service = new ReviewService(mockRepo);

  beforeEach(() => mockRepo.reset());

  describe("Create", () => {
    const mockReview = generateMockReview();

    test("Should return 'review object' when 'repo.create' is called once with 'review data'", async () => {
      mockRepo.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      const review = await service.create(mockReview);

      assert.ok(review);
      assert.deepStrictEqual(review, mockReview);

      assert.strictEqual(mockRepo.create.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockRepo.create.mock.calls[0].arguments[0],
        mockReview,
      );
    });

    test("Should throw 'DatabaseError' when 'repo.create' throws", {
      todo: true,
    });
  });

  describe("getAll", () => {
    const mockReviews = generateMockReviews(4);

    test("Should return 'array of reviews' when 'repo.getAll' is called once with no arguments", async () => {
      mockRepo.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      const reviews = await service.getAll();

      assert.ok(reviews);
      assert.deepStrictEqual(reviews, mockReviews);

      assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
      assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
    });

    test("Should return 'empty array' when 'repo.getAll' return 'empty array'", async () => {
      mockRepo.getAll.mock.mockImplementationOnce(() => Promise.resolve([]));

      const reviews = await service.getAll();

      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseError' when 'repo.getAll' throws", {
      todo: true,
    });
  });

  describe("getAllByUserId", () => {
    const mockReviews = generateMockReviews(4);
    const userId = mockReviews[0].user;

    test("Should return 'array of reviews' when 'repo.getAllByUserId' is called once with 'userId'", async () => {
      mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      const reviews = await service.getAllByUserId({ userId });

      assert.ok(reviews);
      assert.deepStrictEqual(reviews, mockReviews);

      assert.strictEqual(mockRepo.getAllByUserId.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockRepo.getAllByUserId.mock.calls[0].arguments[0],
        { userId },
      );
    });

    test("Should return 'empty array' when 'repo.getAllByUserId' return 'empty array'", async () => {
      mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve([]),
      );

      const reviews = await service.getAllByUserId({ userId });

      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseError' if 'repo.getAllByUserId' throws", {
      todo: true,
    });
  });

  describe("getAllByProductId", () => {
    const mockReviews = generateMockReviews(5);
    const productId = mockReviews[0].product;

    test("Should return 'array of reviews' when'repo.getAllByProductId' is called once with 'productId'", async () => {
      mockRepo.getAllByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReviews),
      );

      const reviews = await service.getAllByProductId({ productId });

      assert.ok(reviews);
      assert.deepEqual(reviews, mockReviews);

      assert.strictEqual(mockRepo.getAllByProductId.mock.callCount(), 1);
      assert.deepEqual(mockRepo.getAllByProductId.mock.calls[0].arguments[0], {
        productId,
      });
    });

    test("Should return empty array if no reviews exist", async () => {
      mockRepo.getAllByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve([]),
      );

      const reviews = await service.getAllByProductId({ productId });

      assert.strictEqual(reviews.length, 0);
    });

    test("Should throw 'DatabaseError' if 'repo.getAllByProductId' throws", {
      todo: true,
    });
  });

  describe("getById", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;

    test("Should return 'review object' when 'repo.getById' is called once with 'reviewId'", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      const review = await service.getById({ reviewId });

      assert.ok(review);
      assert.deepStrictEqual(review, mockReview);

      assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
        reviewId,
      });
    });

    test("Should throw 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        async () => await service.getById({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.getById' throws", {
      todo: true,
    });
  });

  describe("update", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;
    const updateData: Partial<InsertReview> = { comment: "new-comment" };
    const expectedResult = { ...mockReview, ...updateData };

    test("Should return 'review object' when 'repo.update' is called once with 'reviewId' and 'updateData'", async () => {
      mockRepo.update.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const updatedReview = await service.update({
        reviewId,
        data: updateData,
      });

      assert.ok(updatedReview);
      assert.deepEqual(updatedReview, expectedResult);

      assert.strictEqual(mockRepo.update.mock.callCount(), 1);
      assert.deepEqual(mockRepo.update.mock.calls[0].arguments[0], {
        reviewId,
        data: updateData,
      });
    });

    test("Should throw 'NotFoundError' when 'repo.update' returns 'null'", async () => {
      mockRepo.update.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        async () => await service.update({ reviewId, data: updateData }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.update' throws", {
      todo: true,
    });
  });

  describe("delete", () => {
    const mockReview = generateMockReview();
    const reviewId = mockReview._id;

    test("Should return 'review object' when 'repo.delete' is called once with 'reviewId'", async () => {
      mockRepo.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockReview),
      );

      const deletedReview = await service.delete({
        reviewId,
      });

      assert.ok(deletedReview);
      assert.deepEqual(deletedReview, mockReview);

      assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
      assert.deepEqual(mockRepo.delete.mock.calls[0].arguments[0], {
        reviewId,
      });
    });

    test("Should throw 'NotFoundError' when 'repo.delete' returns 'null'", async () => {
      mockRepo.delete.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        async () => await service.delete({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.delete' throws", {
      todo: true,
    });
  });

  describe("countByUserId", () => {
    const mockCount = 10;
    const userId = generateMockObjectId();

    test("Should return the count as number when 'repo.countByUserId' is called once with 'userId'", async () => {
      mockRepo.countByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      const count = await service.countByUserId({ userId });

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);

      assert.strictEqual(mockRepo.countByUserId.mock.callCount(), 1);
      assert.deepEqual(mockRepo.countByUserId.mock.calls[0].arguments[0], {
        userId,
      });
    });

    test("Should return '0' when 'repo.countByUserId' returns '0'", async () => {
      mockRepo.countByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(0),
      );

      const count = await service.countByUserId({ userId });

      assert.strictEqual(count, 0);
    });

    test("Should throw 'DatabaseError' if 'repo.countByUserId' throws", {
      todo: true,
    });
  });

  describe("countByProductId", () => {
    const mockCount = 10;
    const productId = generateMockObjectId();

    test("Should return the count as number when 'repo.countByProductId' is called once with 'productId'", async () => {
      mockRepo.countByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      const count = await service.countByProductId({ productId });

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);

      assert.strictEqual(mockRepo.countByProductId.mock.callCount(), 1);
      assert.deepEqual(mockRepo.countByProductId.mock.calls[0].arguments[0], {
        productId,
      });
    });

    test("Should return '0' when 'repo.countByProductId' returns '0'", async () => {
      mockRepo.countByProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(0),
      );

      const count = await service.countByProductId({ productId });

      assert.strictEqual(count, 0);
    });

    test("Should throw 'DatabaseError' if 'repo.countByProductId' throws", {
      todo: true,
    });
  });

  describe("existsById", () => {
    const reviewId = generateMockObjectId();
    const expectedResult = { _id: reviewId };

    test("Should return 'reviewId' when 'repo.existsById' is called once with 'reviewId'", async () => {
      mockRepo.existsById.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const count = await service.existsById({ reviewId });

      assert.ok(count);
      assert.deepEqual(count, expectedResult);

      assert.strictEqual(mockRepo.existsById.mock.callCount(), 1);
      assert.deepEqual(mockRepo.existsById.mock.calls[0].arguments[0], {
        reviewId,
      });
    });

    test("Should throw 'NotFoundError' when 'repo.existsById' returns 'null'", async () => {
      mockRepo.existsById.mock.mockImplementationOnce(() =>
        Promise.resolve(null),
      );

      await assert.rejects(
        async () => await service.existsById({ reviewId }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.existsById' throws", {
      todo: true,
    });
  });

  describe("existsByUserIdAndProductId", () => {
    const userId = generateMockObjectId();
    const productId = generateMockObjectId();
    const reviewId = generateMockObjectId();
    const existsResult = { _id: reviewId };

    test("Should return 'reviewId' when'repo.existsByUserIdAndProductId' is called once with 'userId' and 'productId'", async () => {
      mockRepo.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(existsResult),
      );

      const count = await service.existsByUserIdAndProductId({
        userId,
        productId,
      });

      assert.ok(count);
      assert.deepEqual(count, existsResult);

      assert.strictEqual(
        mockRepo.existsByUserIdAndProductId.mock.callCount(),
        1,
      );
      assert.deepEqual(
        mockRepo.existsByUserIdAndProductId.mock.calls[0].arguments[0],
        {
          userId,
          productId,
        },
      );
    });

    test("Should throw 'NotFoundError' when 'repo.existsByUserIdAndProductId' returns 'null'", async () => {
      mockRepo.existsByUserIdAndProductId.mock.mockImplementationOnce(() =>
        Promise.resolve(null),
      );

      await assert.rejects(
        async () =>
          await service.existsByUserIdAndProductId({
            userId,
            productId,
          }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Review not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });

    test(
      "Should throw 'DatabaseError' if 'repo.existsByUserIdAndProductId' throws",
      {
        todo: true,
      },
    );
  });
});
