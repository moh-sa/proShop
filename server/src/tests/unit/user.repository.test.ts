import { Types } from "mongoose";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { DatabaseError } from "../../errors";
import User from "../../models/userModel";
import { userRepository } from "../../repositories";
import { InsertUser } from "../../types";
import { generateMockUser, generateMockUsers } from "../mocks";
import { dbClose, dbConnect } from "../utils";

before(async () => dbConnect());
after(async () => dbClose());
beforeEach(async () => await User.deleteMany({}));
const repo = userRepository;

suite("User Repository", () => {
  describe("Create User", () => {
    test("Should create new user in the database", async () => {
      const mockUser = generateMockUser();

      const user = await repo.createUser({ userData: mockUser });

      assert.ok(user);

      assert.equal(user.name, mockUser.name);
      assert.equal(user.email, mockUser.email);

      assert.ok(user.createdAt instanceof Date);
      assert.ok(user.updatedAt instanceof Date);
      assert.equal(user.createdAt, user.updatedAt);
    });

    test("Should throw 'DatabaseError' if email already exists", async () => {
      const mockUser = generateMockUser();

      await repo.createUser({ userData: mockUser });

      try {
        // creating new user with the same email
        await repo.createUser({ userData: mockUser });
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.type, "DATABASE_ERROR");
        assert.equal(error.statusCode, 500);
      }
    });
  });

  describe("Retrieve User By ID", () => {
    test("Should retrieve a user by ID", async () => {
      const mockUser = generateMockUser();

      const created = await repo.createUser({ userData: mockUser });
      const user = await repo.getUserById({ userId: created._id });

      assert.ok(user);

      assert.equal(user.email, mockUser.email);
    });

    test("Should return 'null' if user does not exist", async () => {
      const user = await repo.getUserById({ userId: new Types.ObjectId() });
      assert.equal(user, null);
    });
  });

  describe("Retrieve User By Email", () => {
    test("Should retrieve a user by Email", async () => {
      const mockUser = generateMockUser();

      const created = await repo.createUser({ userData: mockUser });
      const user = await repo.getUserByEmail({ email: created.email });

      assert.ok(user);

      assert.equal(user.email, mockUser.email);
    });

    test("Should return 'null' if user does not exist", async () => {
      const user = await repo.getUserByEmail({ email: "RANDOM_EMAIL" });
      assert.equal(user, null);
    });
  });

  describe("Retrieve Users", () => {
    test("Should retrieve all users", async () => {
      const numberOfUsers = 5;
      const mockUsers = generateMockUsers(numberOfUsers);

      await User.insertMany(mockUsers);

      const users = await repo.getAllUsers();

      assert.ok(users);

      assert.equal(users.length, numberOfUsers);
    });

    test("Should return an empty array if no users exist", async () => {
      const users = await repo.getAllUsers();
      assert.equal(users.length, 0);
    });
  });

  describe("Update User", () => {
    test("Should find and update a user by ID", async () => {
      const mockUser = generateMockUser();

      const created = await repo.createUser({
        userData: mockUser,
      });

      const updateData: Partial<InsertUser> = {
        name: "RANDOM_NAME",
      };
      const updatedUser = await repo.updateUser({
        userId: created._id,
        updateData,
      });

      assert.ok(updatedUser);

      assert.equal(updatedUser.name, updateData.name);
    });

    test("Should throw 'DatabaseError' if updated with an existing email", async () => {
      const mockUsers = generateMockUsers(2);

      const users = await User.insertMany(mockUsers);

      const updateData: Partial<InsertUser> = {
        email: users[1].email,
      };
      try {
        await repo.updateUser({
          userId: users[0]._id,
          updateData,
        });
      } catch (error) {
        if (error instanceof DatabaseError) {
          assert.equal(error.statusCode, 500);
          assert.equal(error.type, "DATABASE_ERROR");
          assert.ok(error.message.includes("E11000")); // error code for duplication
        }
      }
    });

    test("Should return 'null' if user does not exist", async () => {
      const updatedUser = await repo.updateUser({
        userId: new Types.ObjectId(),
        updateData: { name: "John Doe" },
      });

      assert.equal(updatedUser, null);
    });
  });

  describe("Delete User", () => {
    test("Should find and delete a user by ID", async () => {
      const mockUser = generateMockUser();

      const created = await repo.createUser({
        userData: mockUser,
      });

      const deletedUser = await repo.deleteUser({
        userId: created._id,
      });

      // Validate the user is deleted
      const getUser = await repo.getUserById({ userId: created._id });

      assert.notEqual(deletedUser, null); // returns the deleted user if successful
      assert.equal(getUser, null);
    });

    test("Should return 'null' if user does not exist", async () => {
      const deletedUser = await repo.deleteUser({
        userId: new Types.ObjectId(),
      });

      assert.equal(deletedUser, null);
    });
  });
});
