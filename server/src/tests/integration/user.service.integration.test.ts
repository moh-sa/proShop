import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { NotFoundError } from "../../errors";
import User from "../../models/userModel";
import { UserService } from "../../services/user.service";
import {
  generateMockObjectId,
  generateMockUser,
  generateMockUsers,
} from "../mocks";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("User Service 〖 Integration Tests 〗", () => {
  let userService: UserService;
  const mockUser = generateMockUser();
  const mockUsers = generateMockUsers(3);

  before(async () => connectTestDatabase());
  after(async () => disconnectTestDatabase());
  beforeEach(async () => {
    await User.deleteMany({});
    userService = new UserService();
  });

  describe("getById", () => {
    test("Should return user when 'repo.getById' is called with a valid ID", async () => {
      // Arrange
      await User.create(mockUser);

      // Act
      const result = await userService.getById({ userId: mockUser._id });

      // Assert
      assert.strictEqual(result.name, mockUser.name);
      assert.strictEqual(result.email, mockUser.email);
      assert.strictEqual(result.isAdmin, mockUser.isAdmin);
    });

    test("Should not return 'password' and 'token' when 'repo.getById' is called", async () => {
      // Arrange
      await User.create(mockUser);

      // Act
      const result = await userService.getById({ userId: mockUser._id });

      // Assert
      assert.ok(!("password" in result));
      assert.ok(!("token" in result));
    });

    test("Should throw 'NotFoundError' when 'repo.getById' is called with a non-existent ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(async () => {
        await userService.getById({ userId: nonExistentId });
      }, NotFoundError);
    });
  });

  describe("getByEmail", () => {
    test("Should return user when 'repo.getByEmail' is called with a valid email", async () => {
      // Arrange
      await User.create(mockUser);

      // Act
      const result = await userService.getByEmail({ email: mockUser.email });

      // Assert
      assert.strictEqual(result.name, mockUser.name);
      assert.strictEqual(result.email, mockUser.email);
      assert.strictEqual(result.isAdmin, mockUser.isAdmin);
    });

    test("Should not return 'password' and 'token' when 'repo.getByEmail' is called", async () => {
      // Arrange
      await User.create(mockUser);

      // Act
      const result = await userService.getByEmail({ email: mockUser.email });

      // Assert
      assert.ok(!("password" in result));
      assert.ok(!("token" in result));
    });

    test("Should throw 'NotFoundError' when 'repo.getByEmail' is called with a non-existent email", async () => {
      // Arrange
      const nonExistentEmail = "nonexistent@example.com";

      // Act & Assert
      await assert.rejects(async () => {
        await userService.getByEmail({ email: nonExistentEmail });
      }, NotFoundError);
    });
  });

  describe("getAll", () => {
    test("Should return array of users when 'repo.getAll' is called", async () => {
      // Arrange
      await User.insertMany(mockUsers);

      // Act
      const results = await userService.getAll();

      // Assert
      assert(Array.isArray(results));
      assert(results.length > 0);
      const foundUser = results.find(
        (user) => user.email === mockUsers[0].email,
      );
      assert(foundUser);
      assert.strictEqual(foundUser.name, mockUsers[0].name);
      assert.strictEqual(foundUser.email, mockUsers[0].email);
    });

    test("Should not return 'password' and 'token' when 'repo.getAll' is called", async () => {
      // Arrange
      await User.insertMany(mockUsers);

      // Act
      const results = await userService.getAll();

      // Assert
      assert(Array.isArray(results));
      assert(results.length > 0);

      results.forEach((user) => {
        assert.ok(!("password" in user));
        assert.ok(!("token" in user));
      });
    });
  });

  describe("updateById", () => {
    test("Should update user when 'repo.updateById' is called with valid data", async () => {
      // Arrange
      await User.create(mockUser);
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      // Act
      const result = await userService.updateById({
        userId: mockUser._id,
        data: updateData,
      });

      // Assert
      assert.strictEqual(result.name, updateData.name);
      assert.strictEqual(result.email, updateData.email);
      assert.strictEqual(result.isAdmin, mockUser.isAdmin);
    });

    test("Should not return 'password' and 'token' when 'repo.updateById' is called", async () => {
      // Arrange
      await User.create(mockUser);
      const updateData = { name: "Updated Name" };

      // Act
      const result = await userService.updateById({
        userId: mockUser._id,
        data: updateData,
      });

      // Assert
      assert.ok(!("password" in result));
      assert.ok(!("token" in result));
    });

    test("Should update admin status when 'repo.updateById' is called with isAdmin field", async () => {
      // Arrange
      await User.create(mockUser);
      const updateData = { isAdmin: true };

      // Act
      const result = await userService.updateById({
        userId: mockUser._id,
        data: updateData,
      });

      // Assert
      assert.strictEqual(result.isAdmin, true);
      assert.strictEqual(result.name, mockUser.name);
      assert.strictEqual(result.email, mockUser.email);
    });

    test("Should not update fields when 'repo.updateById' is called with empty object", async () => {
      // Arrange
      await User.create(mockUser);
      const updateData = {};

      // Act
      const result = await userService.updateById({
        userId: mockUser._id,
        data: updateData,
      });

      // Assert
      assert.strictEqual(result.name, mockUser.name);
      assert.strictEqual(result.email, mockUser.email);
      assert.strictEqual(result.isAdmin, mockUser.isAdmin);
    });

    test("Should not update fields when 'repo.updateById' is called with undefined values", async () => {
      // Arrange
      await User.create(mockUser);
      const updateData = { name: undefined, email: "new@example.com" };

      // Act
      const result = await userService.updateById({
        userId: mockUser._id,
        data: updateData,
      });

      // Assert
      assert.strictEqual(result.name, mockUser.name); // Name should not be changed
      assert.strictEqual(result.email, "new@example.com"); // Email should update
    });

    test("Should throw 'NotFoundError' when 'repo.updateById' is called with a non-existent ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();
      const updateData = { name: "Updated Name" };

      // Act & Assert
      await assert.rejects(async () => {
        await userService.updateById({
          userId: nonExistentId,
          data: updateData,
        });
      }, NotFoundError);
    });
  });

  describe("delete", () => {
    test("Should delete user when 'repo.delete' is called with a valid ID", async () => {
      // Arrange
      await User.create(mockUser);

      // Act
      const result = await userService.delete({ userId: mockUser._id });

      // Assert
      assert.strictEqual(result.name, mockUser.name);
      assert.strictEqual(result.email, mockUser.email);

      // Verify user is actually deleted
      await assert.rejects(async () => {
        await userService.getById({ userId: mockUser._id });
      }, NotFoundError);
    });

    test("Should throw 'NotFoundError' when 'repo.delete' is called with a non-existent ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act & Assert
      await assert.rejects(async () => {
        await userService.delete({ userId: nonExistentId });
      }, NotFoundError);
    });
  });
});
