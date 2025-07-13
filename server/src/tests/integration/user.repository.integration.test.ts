import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import {
  DatabaseDuplicateKeyError,
  DatabaseValidationError,
} from "../../errors/database";
import User from "../../models/userModel";
import { UserRepository } from "../../repositories/user.repository";
import { generateMockObjectId } from "../mocks";
import { generateMockUser, generateMockUsers } from "../mocks/user.mock";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("UserRepository 〖 Integration Tests 〗", async () => {
  const repo = new UserRepository();

  before(async () => connectTestDatabase());
  after(async () => disconnectTestDatabase());
  beforeEach(async () => await User.deleteMany({}));

  describe("create", () => {
    test("Should create a new user when 'db.create' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();

      // Act
      const createdUser = await repo.create(mockUser);

      // Assert
      assert.ok(createdUser._id);
      assert.equal(createdUser.name, mockUser.name);
      assert.equal(createdUser.email, mockUser.email);
      assert.equal(createdUser.isAdmin, mockUser.isAdmin);
      assert.ok(createdUser.createdAt);
      assert.ok(createdUser.updatedAt);
    });

    test("Should create admin and non-admin users when 'db.create' is called", async () => {
      // Arrange
      const adminUser = generateMockUser(true);
      const regularUser = generateMockUser(false);

      // Act
      const createdAdmin = await repo.create(adminUser);
      const createdRegular = await repo.create(regularUser);

      // Assert
      assert.equal(createdAdmin.isAdmin, true);
      assert.equal(createdRegular.isAdmin, false);
    });

    test("Should set timestamps as Date objects when 'db.create' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();

      // Act
      const createdUser = await repo.create(mockUser);

      // Assert
      assert.ok(createdUser.createdAt instanceof Date);
      assert.ok(createdUser.updatedAt instanceof Date);
    });

    test("Should accept Unicode characters in name when 'db.create' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.name = "Mohamméd 🎉";

      // Act
      const createdUser = await repo.create(mockUser);

      // Assert
      assert.equal(createdUser.name, mockUser.name);
    });

    test("Should throw 'DatabaseDuplicateKeyError' when creating user with existing email", async () => {
      // Arrange
      const mockUser = generateMockUser();
      await repo.create(mockUser);

      // Act & Assert
      await assert.rejects(
        async () => await repo.create(mockUser),
        DatabaseDuplicateKeyError,
      );
    });

    test("Should throw 'DatabaseValidationError' when creating user with invalid data", async () => {
      // Arrange
      const invalidUser = {
        name: "",
        email: "invalid-email",
        password: "pass",
        isAdmin: false,
      };

      // Act & Assert
      await assert.rejects(
        async () => await repo.create(invalidUser),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseValidationError' when 'db.create' is called with empty name", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.name = "";

      // Act & Assert
      await assert.rejects(
        async () => await repo.create(mockUser),
        DatabaseValidationError,
      );
    });
  });

  describe("getAll", () => {
    test("Should return all users when 'db.find' is called", async () => {
      // Arrange
      const mockUsers = generateMockUsers(3);
      await User.insertMany(mockUsers);

      // Act
      const users = await repo.getAll();

      // Assert
      assert.equal(users.length, mockUsers.length);
    });

    test("Should return empty array when 'db.find' is called with no users exist", async () => {
      // Act
      const users = await repo.getAll();

      // Assert
      assert.equal(users.length, 0);
    });
  });

  describe("getById", () => {
    test("Should return user by ID when 'db.findById' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const user = await User.create(mockUser);

      // Act
      const foundUser = await repo.getById({ userId: user._id });

      // Assert
      assert.ok(foundUser);
      assert.equal(foundUser.name, mockUser.name);
      assert.equal(foundUser.email, mockUser.email);
    });

    test("Should return null for non-existent ID when 'db.findById' is called", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act
      const user = await repo.getById({ userId: nonExistentId });

      // Assert
      assert.equal(user, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findById' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as any;

      // Act & Assert
      await assert.rejects(
        async () => await repo.getById({ userId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("getByEmail", () => {
    test("Should return user by email when 'db.findOne' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      await User.create(mockUser);

      // Act
      const foundUser = await repo.getByEmail({
        email: mockUser.email,
      });

      // Assert
      assert.ok(foundUser);
      assert.equal(foundUser?.name, mockUser.name);
      assert.equal(foundUser?.email, mockUser.email);
    });

    test("Should return null for non-existent email when 'db.findOne' is called", async () => {
      // Act
      const foundUser = await repo.getByEmail({
        email: "nonexistent@example.com",
      });

      // Assert
      assert.equal(foundUser, null);
    });

    test("Should handle special characters in email when 'db.findOne' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = "test+label@example.com";
      await User.create(mockUser);

      // Act
      const foundUser = await repo.getByEmail({
        email: mockUser.email,
      });

      // Assert
      assert.ok(foundUser);
      assert.equal(foundUser?.email, mockUser.email);
    });
  });

  describe("update", () => {
    test("Should update user data when 'db.update' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const user = await User.create(mockUser);
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      // Act
      const updatedUser = await repo.update({
        userId: user._id,
        data: updateData,
      });

      // Assert
      assert.ok(updatedUser);
      assert.equal(updatedUser?.name, updateData.name);
      assert.equal(updatedUser?.email, updateData.email);
    });

    test("Should handle partial updates when 'db.update' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const user = await User.create(mockUser);
      const updateData = { name: "Updated Name" };

      // Act
      const updatedUser = await repo.update({
        userId: user._id,
        data: updateData,
      });

      // Assert
      assert.ok(updatedUser);
      assert.equal(updatedUser.name, updateData.name);
      assert.equal(updatedUser.email, mockUser.email); // Email should remain unchanged
    });

    test("Should update timestamps when 'db.update' is called", async (t) => {
      // Arrange
      t.mock.timers.enable({ apis: ["Date"], now: new Date() });
      const mockUser = generateMockUser();
      const user = await User.create(mockUser);
      const originalUpdatedAt = user.updatedAt;

      t.mock.timers.tick(100);

      // Act
      const updatedUser = await repo.update({
        userId: user._id,
        data: { name: "Updated Name" },
      });

      // Assert
      assert.ok(updatedUser);
      assert.ok(updatedUser.updatedAt > originalUpdatedAt);
    });

    test("Should return null for non-existent ID when 'db.update' is called", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();
      const updateData = { name: "Updated Name" };

      // Act
      const user = await repo.update({
        userId: nonExistentId,
        data: updateData,
      });

      // Assert
      assert.equal(user, null);
    });

    test("Should throw 'DatabaseDuplicateKeyError' when 'db.update' is called with existing email", async () => {
      // Arrange
      const user1 = await repo.create(generateMockUser());
      const user2 = await repo.create(generateMockUser());

      // Act & Assert
      await assert.rejects(
        async () =>
          await repo.update({
            userId: user2._id,
            data: { email: user1.email },
          }),
        DatabaseDuplicateKeyError,
      );
    });
  });

  describe("delete", () => {
    test("Should delete user when 'db.delete' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const user = await User.create(mockUser);

      // Act
      const deletedUser = await repo.delete({ userId: user._id });
      const foundUser = await User.findById(user._id);

      // Assert
      assert.ok(deletedUser);
      assert.equal(deletedUser.email, mockUser.email);
      assert.equal(foundUser, null);
    });

    test("Should return null for non-existent ID when 'db.delete' is called", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act
      const user = await repo.delete({ userId: nonExistentId });

      // Assert
      assert.equal(user, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.delete' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as any;

      // Act & Assert
      await assert.rejects(
        async () => await repo.delete({ userId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("existsByEmail", () => {
    test("Should check if user exists by email when 'db.findOne' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      await User.create(mockUser);

      // Act
      const exists = await repo.existsByEmail({
        email: mockUser.email,
      });
      const notExists = await repo.existsByEmail({
        email: "nonexistent@example.com",
      });

      // Assert
      assert.ok(exists);
      assert.equal(notExists, null);
    });

    test("Should handle special characters in email when 'db.findOne' is called", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = "test+label@example.com";
      await User.create(mockUser);

      // Act
      const exists = await repo.existsByEmail({
        email: mockUser.email,
      });

      // Assert
      assert.ok(exists);
    });
  });
});
