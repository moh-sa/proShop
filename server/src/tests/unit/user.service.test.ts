import { Types } from "mongoose";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { DatabaseError, NotFoundError } from "../../errors";
import User from "../../models/userModel";
import { userService } from "../../services";
import { mockUser1, mockUser2, mockUser3 } from "../mocks";
import { dbClose, dbConnect } from "../utils";

before(async () => dbConnect());
after(async () => dbClose());

suite("User Service", () => {
  beforeEach(async () => await User.deleteMany({}));

  const service = userService;

  describe("Register User", () => {
    test("Should register a new user and return user data with token and without password", async () => {
      const response = await service.signup(mockUser1.insert);

      assert.ok(response.token);
      assert.equal(response.email, mockUser1.select.email);
      assert.equal(response.name, mockUser1.select.name);
      assert.ok(!response.password);
    });

    test("Should throw 'DatabaseError' if the user's email already exists", async () => {
      await service.signup(mockUser1.insert);
      try {
        // add duplicate user
        await service.signup(mockUser1.insert);
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.type, "DATABASE_ERROR");
        assert.equal(error.statusCode, 500);
      }
    });
  });

  describe("Authenticate User", () => {
    test("Should authenticate user and return user data and token", async () => {
      const user = await User.create(mockUser1.insert);
      const response = await service.signin({
        email: user.email,
        password: user.password,
      });

      assert.ok(response.token);
      assert.equal(response.email, mockUser1.insert.email);
    });
  });

  describe("Retrieve User By ID", () => {
    test("Should retrieve user data by ID without password or token", async () => {
      const user = await User.create(mockUser1.insert);
      const response = await service.getById({ userId: user._id });

      assert.equal(response._id?.toString(), user._id?.toString());
      assert.equal(response.email, mockUser1.select.email);

      assert.ok(!response.password);
      assert.ok(!response.token);
    });

    test("Should throw `NotFoundError` if user does not exist", async () => {
      try {
        await service.getById({ userId: new Types.ObjectId() });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.type, "NOT_FOUND");
        assert.equal(error.statusCode, 404);
      }
    });
  });

  describe("Retrieve User By Email", () => {
    test("Should retrieve a user by Email", async () => {
      const user = await User.create(mockUser1.insert);
      const response = await service.getByEmail({ email: user.email });

      assert.equal(response.email, mockUser1.select.email);
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
      const mockUsers = [mockUser1.insert, mockUser2.insert, mockUser3.insert];
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
    test("Should find and update sure, ensure the return match the mock data and without token", async () => {
      const created = await service.signup(mockUser1.insert);

      const updateData = { name: mockUser2.insert.name };
      const updatedUser = await service.updateById({
        userId: created._id!,
        updateData,
      });

      assert.ok(updatedUser);

      assert.equal(updatedUser.name, updateData.name);

      assert.ok(!updatedUser.token);
    });

    test("Should throw 'DatabaseError' if updated with an existing email", async () => {
      await service.signup(mockUser2.insert);
      const created = await service.signup(mockUser1.insert);

      const updateData = {
        email: mockUser2.insert.email,
      };
      try {
        await service.updateById({
          userId: created._id!,
          updateData,
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
        await service.updateById({
          userId: mockUser1.select._id,
          updateData: { name: mockUser1.select.name },
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
      const created = await service.signup(mockUser1.insert);

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
