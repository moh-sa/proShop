import mongoose from "mongoose";
import assert from "node:assert/strict";
import { beforeEach, describe, mock, suite, test } from "node:test";
import {
  DatabaseDuplicateKeyError,
  DatabaseNetworkError,
  DatabaseQueryError,
  DatabaseTimeoutError,
  DatabaseValidationError,
  GenericDatabaseError,
} from "../../errors";
import User from "../../models/userModel";
import { UserRepository } from "../../repositories";
import { InsertUser } from "../../types";
import {
  generateMockObjectId,
  generateMockUser,
  generateMockUsers,
} from "../mocks";

suite("User Repository〖 Unit Tests 〗", () => {
  const repo = new UserRepository();
  beforeEach(() => mock.reset());

  describe("create", () => {
    const { token, ...mockUser } = generateMockUser();

    test("Should return 'user object' when 'db.create' is called once with 'user data'", async (t) => {
      const createMock = t.mock.method(User, "create", async () => ({
        toObject: () => mockUser,
      }));

      const user = await repo.create(mockUser);

      assert.ok(user);
      assert.deepStrictEqual(user, mockUser);

      assert.strictEqual(createMock.mock.callCount(), 1);
      assert.deepStrictEqual(createMock.mock.calls[0].arguments[0], mockUser);
    });

    test("Should throw 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(User, "create", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseDuplicateKeyError' when 'db.create' throws 'MongoServerError' with code '11000'", async (t) => {
      const validationError = new mongoose.mongo.MongoServerError({});
      validationError.code = 11000;

      t.mock.method(User, "create", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        DatabaseDuplicateKeyError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(User, "create", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(User, "create", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(User, "create", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "create", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        GenericDatabaseError,
      );
    });
  });

  describe("getAll", () => {
    const mockUsers = generateMockUsers(5);

    test("Should return 'array of users' when 'db.find' is called once with 'empty object'", async (t) => {
      const findMock = t.mock.method(User, "find", () => ({
        lean: async () => mockUsers,
      }));

      const users = await repo.getAll();

      assert.ok(users);
      assert.deepStrictEqual(users, mockUsers);

      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {});
    });

    test("Should return 'empty array' when 'db.find' returns 'empty array'", async (t) => {
      t.mock.method(User, "find", () => ({
        lean: async () => [],
      }));

      const users = await repo.getAll();

      assert.strictEqual(users.length, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(User, "find", () => {
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

      t.mock.method(User, "find", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(User, "find", () => {
        throw queryError;
      });

      await assert.rejects(async () => await repo.getAll(), DatabaseQueryError);
    });

    test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(User, "find", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        GenericDatabaseError,
      );
    });
  });

  describe("getById", () => {
    const mockUser = generateMockUser();
    const userId = mockUser._id;

    test("Should return 'user object' when 'db.findById' is called once with 'userId'", async (t) => {
      const findByIdMock = t.mock.method(User, "findById", () => ({
        lean: async () => mockUser,
      }));

      const user = await repo.getById({ userId });

      assert.ok(user);
      assert.deepStrictEqual(user, mockUser);

      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], userId);
    });

    test("Should return 'null' when 'db.findById' returns 'null'", async (t) => {
      t.mock.method(User, "findById", () => ({
        lean: async () => null,
      }));

      const user = await repo.getById({ userId });

      assert.strictEqual(user, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(User, "findById", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getById({ userId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(User, "findById", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getById({ userId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(User, "findById", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.getById({ userId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(User, "findById", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getById({ userId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "findById", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getById({ userId }),
        GenericDatabaseError,
      );
    });
  });

  describe("getByEmail", () => {
    const mockUser = generateMockUser();
    const email = mockUser.email;

    test("Should return 'user object' when 'db.findOne' is called once with 'email'", async (t) => {
      const findOneMock = t.mock.method(User, "findOne", () => ({
        lean: async () => mockUser,
      }));

      const user = await repo.getByEmail({ email });

      assert.ok(user);
      assert.deepStrictEqual(user, mockUser);

      assert.strictEqual(findOneMock.mock.callCount(), 1);
      assert.deepStrictEqual(findOneMock.mock.calls[0].arguments[0], { email });
    });

    test("Should return 'null' when 'db.findOne' returns 'null'", async (t) => {
      t.mock.method(User, "findOne", () => ({
        lean: async () => null,
      }));

      const user = await repo.getByEmail({ email });

      assert.strictEqual(user, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findOne' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(User, "findOne", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getByEmail({ email }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findOne' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(User, "findOne", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getByEmail({ email }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findOne' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(User, "findOne", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.getByEmail({ email }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findOne' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(User, "findOne", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getByEmail({ email }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findOne' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "findOne", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getByEmail({ email }),
        GenericDatabaseError,
      );
    });
  });

  describe("update", () => {
    const mockUser = generateMockUser();
    const userId = mockUser._id;
    const updateData: Partial<InsertUser> = { name: "Updated Name" };
    const expectedResult = { ...mockUser, ...updateData };

    test("Should return 'user object' when 'db.findByIdAndUpdate' is called once with 'userId' and 'updateData'", async (t) => {
      const findByIdAndUpdateMock = t.mock.method(
        User,
        "findByIdAndUpdate",
        () => ({
          lean: async () => expectedResult,
        }),
      );

      const updatedUser = await repo.update({ userId, data: updateData });

      assert.ok(updatedUser);
      assert.deepStrictEqual(updatedUser, expectedResult);

      assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[0],
        userId,
      );
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[1],
        updateData,
      );
    });

    test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
      t.mock.method(User, "findByIdAndUpdate", () => ({
        lean: async () => null,
      }));

      const updatedUser = await repo.update({ userId, data: updateData });

      assert.strictEqual(updatedUser, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(User, "findByIdAndUpdate", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseDuplicateKeyError' when 'db.findByIdAndUpdate' throws 'MongoServerError' with code '11000'", async (t) => {
      const validationError = new mongoose.mongo.MongoServerError({});
      validationError.code = 11000;

      t.mock.method(User, "findByIdAndUpdate", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        DatabaseDuplicateKeyError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(User, "findByIdAndUpdate", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(User, "findByIdAndUpdate", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(User, "findByIdAndUpdate", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        GenericDatabaseError,
      );
    });
  });

  describe("delete", () => {
    const mockUser = generateMockUser();
    const userId = mockUser._id;

    test("Should return 'user object' when 'db.findByIdAndDelete' is called once with 'userId'", async (t) => {
      const findByIdAndDeleteMock = t.mock.method(
        User,
        "findByIdAndDelete",
        () => ({
          lean: async () => mockUser,
        }),
      );

      const deletedUser = await repo.delete({ userId });

      assert.ok(deletedUser);
      assert.deepStrictEqual(deletedUser, mockUser);

      assert.strictEqual(findByIdAndDeleteMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        findByIdAndDeleteMock.mock.calls[0].arguments[0],
        userId,
      );
    });

    test("Should return 'null' when 'db.findByIdAndDelete' returns 'null' ", async (t) => {
      t.mock.method(User, "findByIdAndDelete", () => ({
        lean: async () => null,
      }));

      const deletedUser = await repo.delete({ userId });

      assert.strictEqual(deletedUser, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findByIdAndDelete' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(User, "findByIdAndDelete", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.delete({ userId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findByIdAndDelete' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(User, "findByIdAndDelete", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.delete({ userId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findByIdAndDelete' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(User, "findByIdAndDelete", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.delete({ userId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findByIdAndDelete' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(User, "findByIdAndDelete", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.delete({ userId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findByIdAndDelete' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "findByIdAndDelete", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.delete({ userId }),
        GenericDatabaseError,
      );
    });
  });

  describe("existsByEmail", () => {
    const email = "exists@example.com";
    const expectedResult = { _id: generateMockObjectId() };

    test("Should return 'userId' when 'db.exists' is called once with 'email'", async (t) => {
      const existsMock = t.mock.method(User, "exists", () => ({
        lean: async () => expectedResult,
      }));

      const result = await repo.existsByEmail({ email });

      assert.ok(result);
      assert.deepStrictEqual(result, expectedResult);

      assert.strictEqual(existsMock.mock.callCount(), 1);
      assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], { email });
    });

    test("Should return 'null' when 'db.exists' returns 'null'", async (t) => {
      t.mock.method(User, "exists", () => ({
        lean: async () => null,
      }));

      const result = await repo.existsByEmail({ email });

      assert.strictEqual(result, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.exists' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(User, "exists", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.existsByEmail({ email }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.exists' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(User, "exists", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.existsByEmail({ email }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.exists' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(User, "exists", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.existsByEmail({ email }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.exists' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(User, "exists", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.existsByEmail({ email }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.exists' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "exists", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.existsByEmail({ email }),
        GenericDatabaseError,
      );
    });
  });
});
