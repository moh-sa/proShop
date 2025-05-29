import mongoose from "mongoose";
import assert from "node:assert/strict";
import { beforeEach, describe, mock, suite, test } from "node:test";
import { DatabaseError } from "../../errors";
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

    test("Should throw 'DatabaseError' when 'db.create' throws Mongoose errors", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(User, "create", async () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.create' throws unknown errors", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "create", async () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.find' throws Mongoose errors", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(User, "find", () => ({
        lean: async () => {
          throw mongooseError;
        },
      }));

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

      t.mock.method(User, "find", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(async () => await repo.getAll(), DatabaseError);
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

    test("Should throw 'DatabaseError' when 'User.findById' throws Mongoose errors", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(User, "findById", () => ({
        lean: async () => {
          throw mongooseError;
        },
      }));

      await assert.rejects(
        async () => await repo.getById({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'User.findById' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "findById", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.getById({ userId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.findOne' throws Mongoose errors", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(User, "findOne", () => ({
        lean: async () => {
          throw mongooseError;
        },
      }));

      await assert.rejects(
        async () => await repo.getByEmail({ email }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'User.findOne({ email })' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "findOne", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.getByEmail({ email }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.findByIdAndUpdate' throws a mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(User, "findByIdAndUpdate", () => ({
        lean: async () => {
          throw mongooseError;
        },
      }));

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "findByIdAndUpdate", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.findByIdAndDelete' throws Mongoose errors", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(User, "findByIdAndDelete", () => ({
        lean: async () => {
          throw mongooseError;
        },
      }));

      await assert.rejects(
        async () => await repo.delete({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.findByIdAndDelete' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(User, "findByIdAndDelete", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.delete({ userId }),
        DatabaseError,
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

    test("Should throw 'DatabaseError' when 'db.exists' throws Mongoose errors", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(User, "exists", () => ({
        lean: async () => {
          throw mongooseError;
        },
      }));

      await assert.rejects(
        async () => await repo.existsByEmail({ email }),
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

      t.mock.method(User, "exists", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.existsByEmail({ email }),
        DatabaseError,
      );
    });
  });
});
