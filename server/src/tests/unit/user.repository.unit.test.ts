import mongoose from "mongoose";
import assert from "node:assert/strict";
import { afterEach, describe, mock, suite, test } from "node:test";
import { DatabaseError } from "../../errors";
import User from "../../models/userModel";
import { userRepository } from "../../repositories";
import { InsertUser } from "../../types";
import {
  generateMockObjectId,
  generateMockUser,
  generateMockUsers,
} from "../mocks";

suite("User Repository〖 Unit Tests 〗", () => {
  const repo = userRepository;
  afterEach(() => mock.reset());

  describe("Create User", () => {
    test("Should return the created user object when 'User.create' is called", async () => {
      const { token, ...mockUser } = generateMockUser();

      const createMock = mock.method(User, "create", async () => ({
        toObject: () => mockUser,
      }));

      const user = await repo.create(mockUser);

      assert.ok(user);
      assert.deepStrictEqual(user, mockUser);
      assert.strictEqual(createMock.mock.callCount(), 1);
      assert.deepStrictEqual(createMock.mock.calls[0].arguments[0], mockUser);
    });

    test("Should throw 'DatabaseError' when 'User.create' throws a duplicate key error", async () => {
      const mockUser = generateMockUser();
      const mongoError = new mongoose.mongo.MongoError(
        "E11000 duplicate key error",
      );
      mongoError.code = 11000;

      mock.method(User, "create", async () => {
        throw mongoError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongoError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' when 'User.create' throws Mongoose errors", async () => {
      const mockUser = generateMockUser();
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      mock.method(User, "create", async () => {
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

    test("Should throw generic 'DatabaseError' when 'User.create' throws unknown errors", async () => {
      const mockUser = generateMockUser();
      const unknownError = new Error("Something unexpected happened");

      mock.method(User, "create", async () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create(mockUser),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve Users", () => {
    test("Should return array of all users when 'User.find({})' is called", async () => {
      const mockUsers = generateMockUsers(3);

      const findMock = mock.method(User, "find", () => ({
        lean: async () => mockUsers,
      }));

      const users = await repo.getAll();

      assert.ok(users);
      assert.strictEqual(users.length, mockUsers.length);
      assert.deepStrictEqual(users, mockUsers);
      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {});
    });

    test("Should return empty array when 'User.find({})' returns empty array", async () => {
      mock.method(User, "find", () => ({
        lean: async () => [],
      }));

      const users = await repo.getAll();

      assert.ok(users);
      assert.strictEqual(users.length, 0);
    });

    test("Should throw 'DatabaseError' when 'User.find({})' throws Mongoose errors", async () => {
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(User, "find", () => ({
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

    test("Should throw generic 'DatabaseError' when 'User.find({})' throws unknown error", async () => {
      const unknownError = new Error("Something unexpected happened");

      mock.method(User, "find", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

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

  describe("Retrieve User By ID", () => {
    test("Should return the user object when 'User.findById' is called", async () => {
      const mockUser = generateMockUser();
      const userId = mockUser._id;

      const findByIdMock = mock.method(User, "findById", () => ({
        lean: async () => mockUser,
      }));

      const user = await repo.getById({ userId });

      assert.ok(user);
      assert.deepStrictEqual(user, mockUser);
      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], userId);
    });

    test("Should return 'null' when 'User.findById' returns 'null'", async () => {
      const userId = generateMockObjectId();

      mock.method(User, "findById", () => ({
        lean: async () => null,
      }));

      const user = await repo.getById({ userId });

      assert.strictEqual(user, null);
    });

    test("Should throw 'DatabaseError' when 'User.findById' throws Mongoose errors", async () => {
      const userId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(User, "findById", () => ({
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

    test("Should throw generic 'DatabaseError' when 'User.findById' throws unknown error", async () => {
      const userId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(User, "findById", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.getById({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve User By Email", () => {
    test("Should return the user object when 'User.findOne({ email })' is called", async () => {
      const mockUser = generateMockUser();
      const email = mockUser.email;

      const findOneMock = mock.method(User, "findOne", () => ({
        lean: async () => mockUser,
      }));

      const user = await repo.getByEmail({ email });

      assert.ok(user);
      assert.deepStrictEqual(user, mockUser);
      assert.strictEqual(findOneMock.mock.callCount(), 1);
      assert.deepStrictEqual(findOneMock.mock.calls[0].arguments[0], { email });
    });

    test("Should return 'null' when 'User.findOne({ email })' returns 'null'", async () => {
      const email = "nonexistent@example.com";

      mock.method(User, "findOne", () => ({
        lean: async () => null,
      }));

      const user = await repo.getByEmail({ email });

      assert.strictEqual(user, null);
    });

    test("Should throw 'DatabaseError' when 'User.findOne({ email })' throws Mongoose errors", async () => {
      const email = "test@example.com";
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(User, "findOne", () => ({
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

    test("Should throw generic 'DatabaseError' when 'User.findOne({ email })' throws unknown error", async () => {
      const email = "test@example.com";
      const unknownError = new Error("Something unexpected happened");

      mock.method(User, "findOne", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.getByEmail({ email }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Update User", () => {
    test("Should return the updated user object when 'User.findByIdAndUpdate' is called", async () => {
      const mockUser = generateMockUser();
      const userId = mockUser._id;
      const updatedData: Partial<InsertUser> = { name: "Updated Name" };
      const mockUpdatedUser = { ...mockUser, ...updatedData };

      const findByIdAndUpdateMock = mock.method(
        User,
        "findByIdAndUpdate",
        () => ({
          lean: async () => mockUpdatedUser,
        }),
      );

      const updatedUser = await repo.update({ userId, data: updatedData });

      assert.ok(updatedUser);
      assert.deepStrictEqual(updatedUser, mockUpdatedUser);
      assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[0],
        userId,
      );
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[1],
        updatedData,
      );
      assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[2], {
        new: true,
      });
    });

    test("Should return 'null' when 'User.findByIdAndUpdate' returns 'null'", async () => {
      const mockUser = generateMockUser();
      const userId = mockUser._id;
      const updatedData: Partial<InsertUser> = { name: "Updated Name" };

      mock.method(User, "findByIdAndUpdate", () => ({
        lean: async () => null,
      }));

      const updatedUser = await repo.update({ userId, data: updatedData });

      assert.strictEqual(updatedUser, null);
    });

    test("Should throw 'DatabaseError' when 'User.findByIdAndUpdate' throws a duplicate key error", async () => {
      const mockUser = generateMockUser();
      const userId = mockUser._id;
      const updatedData: Partial<InsertUser> = {
        email: "duplicate@example.com",
      };
      const mongoError = new mongoose.mongo.MongoError(
        "E11000 duplicate key error",
      );
      mongoError.code = 11000;

      mock.method(User, "findByIdAndUpdate", () => ({
        lean: async () => {
          throw mongoError;
        },
      }));

      await assert.rejects(
        async () => await repo.update({ userId, data: updatedData }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongoError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Review.findByIdAndUpdate' throws unknown error", async () => {
      const userId = generateMockObjectId();
      const updateData: Partial<InsertUser> = { name: "Updated Name" };
      const unknownError = new Error("Something unexpected happened");

      mock.method(User, "findByIdAndUpdate", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.update({ userId, data: updateData }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Delete User", () => {
    test("Should return the deleted user object when 'User.findByIdAndDelete' is called", async () => {
      const mockUser = generateMockUser();
      const userId = mockUser._id;

      const findByIdAndDeleteMock = mock.method(
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

    test("Should return 'null' when 'User.findByIdAndDelete' returns 'null' ", async () => {
      const userId = generateMockObjectId();

      mock.method(User, "findByIdAndDelete", () => ({
        lean: async () => null,
      }));

      const deletedUser = await repo.delete({ userId });

      assert.strictEqual(deletedUser, null);
    });

    test("Should throw 'DatabaseError' when 'User.findByIdAndDelete' throws Mongoose errors", async () => {
      const userId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(User, "findByIdAndDelete", () => ({
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

    test("Should throw generic 'DatabaseError' when 'User.findByIdAndDelete' throws unknown error", async () => {
      const userId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(User, "findByIdAndDelete", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.delete({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Exists By Email", () => {
    test("Should return the user ID when 'User.exists({ email })' is called", async () => {
      const email = "exists@example.com";
      const expectedResult = { _id: generateMockObjectId() };

      const existsMock = mock.method(User, "exists", () => ({
        lean: async () => expectedResult,
      }));

      const result = await repo.existsByEmail({ email });

      assert.ok(result);
      assert.deepStrictEqual(result, expectedResult);
      assert.strictEqual(existsMock.mock.callCount(), 1);
      assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], { email });
    });

    test("Should return 'null' when 'User.exists({ email })' returns null", async () => {
      const email = "nonexistent@example.com";

      mock.method(User, "exists", () => ({
        lean: async () => null,
      }));

      const result = await repo.existsByEmail({ email });

      assert.strictEqual(result, null);
    });

    test("Should throw 'DatabaseError' when 'User.exists({ email })' throws Mongoose errors", async () => {
      const email = "test@example.com";
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(User, "exists", () => ({
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

    test("Should throw generic 'DatabaseError' when 'User.exists({ email })' throws unknown error", async () => {
      const email = "test@example.com";
      const unknownError = new Error("Something unexpected happened");

      mock.method(User, "exists", () => ({
        lean: async () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.existsByEmail({ email }),
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
