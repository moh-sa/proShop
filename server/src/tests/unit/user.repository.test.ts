import { Types } from "mongoose";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { DatabaseError } from "../../errors";
import User from "../../models/userModel";
import { userRepository } from "../../repositories";
import { InsertUser } from "../../types";
import { mockUser1, mockUser2, mockUser3 } from "../mocks";
import { dbClose, dbConnect } from "../utils";

before(async () => dbConnect());
after(async () => dbClose());

suite("User Repository", () => {
  beforeEach(async () => await User.deleteMany({}));

  const repo = userRepository;

  describe("Create User", () => {
    test("Should create new user in the database", async () => {
      const user = await repo.createUser({ userData: mockUser1.insert });

      assert.ok(user);

      assert.equal(user.name, mockUser1.insert.name);
      assert.equal(user.email, mockUser1.insert.email);

      assert.ok(user.createdAt instanceof Date);
      assert.ok(user.updatedAt instanceof Date);
      assert.equal(user.createdAt, user.updatedAt);
    });

    test("Should throw 'DatabaseError' if email already exists", async () => {
      await repo.createUser({ userData: mockUser1.insert });

      try {
        // creating new user with the same email
        await repo.createUser({ userData: mockUser1.insert });
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.type, "DATABASE_ERROR");
        assert.equal(error.statusCode, 500);
      }
    });
  });

  describe("Retrieve User By ID", () => {
    test("Should retrieve a user by ID", async () => {
      const created = await repo.createUser({ userData: mockUser1.insert });
      const user = await repo.getUserById({ userId: created._id });

      assert.ok(user);

      assert.equal(user.email, mockUser1.insert.email);
    });

    test("Should return 'null' if user does not exist", async () => {
      const user = await repo.getUserById({ userId: new Types.ObjectId() });
      assert.equal(user, null);
    });
  });

  describe("Retrieve User By Email", () => {
    test("Should retrieve a user by Email", async () => {
      const created = await repo.createUser({ userData: mockUser1.insert });
      const user = await repo.getUserByEmail({ email: created.email });

      assert.ok(user);

      assert.equal(user.email, mockUser1.insert.email);
    });

    test("Should return 'null' if user does not exist", async () => {
      const user = await repo.getUserByEmail({ email: "RANDOM_EMAIL" });
      assert.equal(user, null);
    });
  });

  describe("Retrieve Users", () => {
    test("Should retrieve all users", async () => {
      await repo.createUser({ userData: mockUser1.insert });
      await repo.createUser({ userData: mockUser2.insert });
      await repo.createUser({ userData: mockUser3.insert });

      const users = await repo.getAllUsers();

      assert.ok(users);

      assert.equal(users.length, 3);
    });

    test("Should return an empty array if no users exist", async () => {
      const users = await repo.getAllUsers();
      assert.equal(users.length, 0);
    });
  });

  describe("Update User", () => {
    test("Should find and update a user by ID", async () => {
      const created = await repo.createUser({ userData: mockUser1.insert });

      const updateData: Partial<InsertUser> = { name: mockUser2.insert.name };
      const updatedUser = await repo.updateUser({
        userId: created._id,
        updateData,
      });

      assert.ok(updatedUser);

      assert.equal(updatedUser.name, updateData.name);
    });

    test("Should throw 'DatabaseError' if updated with an existing email", async () => {
      await repo.createUser({
        userData: mockUser2.insert,
      });
      const created = await repo.createUser({ userData: mockUser1.insert });

      const updateData: Partial<InsertUser> = {
        email: mockUser2.insert.email,
      };
      try {
        await repo.updateUser({
          userId: created._id,
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
      const created = await repo.createUser({ userData: mockUser1.insert });

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
