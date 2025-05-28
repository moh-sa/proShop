import assert from "node:assert/strict";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { DatabaseError, NotFoundError } from "../../errors";
import User from "../../models/userModel";
import { UserService } from "../../services";
import {
  generateMockObjectId,
  generateMockUser,
  generateMockUsers,
} from "../mocks";
import { connectTestDatabase, disconnectTestDatabase } from "../utils";

before(async () => connectTestDatabase());
after(async () => disconnectTestDatabase());
beforeEach(async () => await User.deleteMany({}));
const service = new UserService();

suite("User Service", () => {
  describe("Retrieve User By ID", () => {
    test("Should retrieve user data by ID without password or token", async () => {
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      const response = await service.getById({ userId: user._id });

      assert.equal(response._id?.toString(), user._id?.toString());
      assert.equal(response.email, user.email);

      assert.ok(!Object.keys(response).includes("password"));
      assert.ok(!Object.keys(response).includes("token"));
    });

    test("Should throw `NotFoundError` if user does not exist", async () => {
      try {
        await service.getById({ userId: generateMockObjectId() });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.type, "NOT_FOUND");
        assert.equal(error.statusCode, 404);
      }
    });
  });

  describe("Retrieve User By Email", () => {
    test("Should retrieve a user by Email", async () => {
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      const response = await service.getByEmail({ email: user.email });

      assert.equal(response.email, mockUser.email);
    });

    test("Should throw 'NotFoundError' if user does not exist", async () => {
      try {
        await service.getByEmail({ email: "RANDOM_EMAIL" });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.type, "NOT_FOUND");
        assert.equal(error.statusCode, 404);
      }
    });
  });

  describe("Retrieve Users", () => {
    test("Should retrieve all users and ensure the returned data match the mock data", async () => {
      const mockUsers = generateMockUsers(3);

      await User.create(mockUsers);
      const response = await service.getAll();

      assert.equal(response.length, 3);
    });

    test("Should return an empty array if no users exist", async () => {
      const users = await service.getAll();
      assert.equal(users.length, 0);
    });
  });

  describe("Update User", () => {
    test("Should find and update user, ensure the return match the mock data and without token", async () => {
      const [mockUser1, mockUser2] = generateMockUsers(2);

      const created = await User.create(mockUser1);

      const data = { name: mockUser2.name };
      const updatedUser = await service.updateById({
        userId: created._id!,
        data,
      });

      assert.ok(updatedUser);

      assert.equal(updatedUser.name, data.name);

      assert.ok(!updatedUser.token);
    });

    test("Should throw 'DatabaseError' if updated with an existing email", async () => {
      const [mockUser1, mockUser2] = generateMockUsers(2);

      await User.create(mockUser1);
      const created = await User.create(mockUser2);

      const data = {
        email: mockUser2.email,
      };
      try {
        await service.updateById({
          userId: created._id!,
          data,
        });
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.statusCode, 500);
        assert.equal(error.type, "DATABASE_ERROR");
        assert.ok(error.message.includes("E11000")); // error code for duplication
      }
    });

    test("Should throw a NotFoundError if user does not exist", async () => {
      try {
        const mockUser = generateMockUser();

        await service.updateById({
          userId: mockUser._id,
          data: { name: mockUser.name },
        });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.type, "NOT_FOUND");
        assert.equal(error.message, "User not found");
      }
    });
  });

  describe("Delete User", () => {
    test("Should delete user and throw 'NotFoundError' to ensure the user is deleted", async () => {
      const mockUser = generateMockUser();

      const created = await User.create(mockUser);

      await service.delete({
        userId: created._id!,
      });

      try {
        await service.getById({ userId: created._id! });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.type, "NOT_FOUND");
        assert.equal(error.message, "User not found");
      }
    });
  });
});
