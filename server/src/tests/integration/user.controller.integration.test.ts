import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { UserController } from "../../controllers";
import User from "../../models/userModel";
import {
  generateMockObjectId,
  generateMockUser,
  generateMockUsers,
} from "../mocks";
import { createMockExpressContext } from "../utils";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("User Controller 〖 Integration Tests 〗", () => {
  const controller = new UserController();

  before(async () => await connectTestDatabase());
  after(async () => await disconnectTestDatabase());
  beforeEach(async () => await User.deleteMany({}));

  describe("getAll", () => {
    test("Should return success response when 'service.getAll' is called successfully", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUsers = generateMockUsers(3);
      await User.insertMany(mockUsers);

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(Array.isArray(response.data));
      assert.equal(response.data.length, 3);
    });

    test("Should return empty array when no users exist", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(Array.isArray(response.data));
      assert.equal(response.data.length, 0);
    });

    test("Should return '200' status code when 'service.getAll' is called", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUsers = generateMockUsers(3);
      await User.insertMany(mockUsers);

      // Act
      await controller.getAll(req, res, next);

      // Assert
      assert.equal(res._getStatusCode(), 200);
    });

    test("Should exclude password field from all users in response", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUsers = generateMockUsers(3);
      await User.insertMany(mockUsers);

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response.data);
      response.data.forEach((user: any) => {
        assert.ok(
          !user.password,
          "Password should not be included in response",
        );
      });
    });

    test("Should include isAdmin field for all users in response", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUsers = generateMockUsers(3);
      await User.insertMany(mockUsers);

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response.data);
      response.data.forEach((user: any) => {
        assert.ok(
          "isAdmin" in user,
          "isAdmin field should be included in response",
        );
        assert.equal(typeof user.isAdmin, "boolean");
      });
    });
  });

  describe("getById", () => {
    test("Should return success response when 'service.getById' is called with valid 'userId' from params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.equal(response.data._id.toString(), mockUser._id.toString());
    });

    test("Should return success response when 'service.getById' is called with valid 'userId' from locals", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      res.locals = {
        token: {
          _id: mockUser._id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        user: mockUser,
        review: {
          _id: generateMockObjectId(),
          user: mockUser._id,
          product: generateMockObjectId(),
          name: mockUser.name,
          rating: 5,
          comment: "Test comment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.equal(response.data._id.toString(), mockUser._id.toString());
    });

    test("Should throw 'NotFoundError' when user does not exist", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const nonExistentId = generateMockObjectId();
      req.params = { userId: nonExistentId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => {
          await controller.getById(req, res, next);
        },
        {
          name: "NotFoundError",
          message: "User not found",
        },
      );
    });

    test("Should return '200' status code when user is found", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      assert.equal(res._getStatusCode(), 200);
    });

    test("Should exclude password field from response", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(
        !response.data.password,
        "Password should not be included in response",
      );
    });

    test("Should include isAdmin field in response", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser(true); // Fixed: passing boolean directly instead of object
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(
        "isAdmin" in response.data,
        "isAdmin field should be included in response",
      );
      assert.equal(response.data.isAdmin, true);
    });

    test("Should throw 'ZodError' when called with invalid objectId format", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { userId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => {
          await controller.getById(req, res, next);
        },
        (error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("update", () => {
    test("Should return success response when 'service.update' is called with valid user id from params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };
      req.body = { name: "Updated Name" };

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.equal(response.data.name, "Updated Name");
    });

    test("Should return success response when 'service.update' is called with valid user id from locals", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      res.locals = {
        token: {
          _id: mockUser._id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        user: mockUser,
        review: {
          _id: generateMockObjectId(),
          user: mockUser._id,
          product: generateMockObjectId(),
          name: mockUser.name,
          rating: 5,
          comment: "Test comment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      req.body = { name: "Updated Name" };

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.equal(response.data.name, "Updated Name");
    });

    test("Should throw 'NotFoundError' when user does not exist", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const nonExistentId = generateMockObjectId();
      req.params = { userId: nonExistentId.toString() };
      req.body = { name: "Updated Name" };

      // Act & Assert
      await assert.rejects(
        async () => {
          await controller.update(req, res, next);
        },
        {
          name: "NotFoundError",
          message: "User not found",
        },
      );
    });

    test("Should throw 'ZodError' when update data is invalid", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };
      req.body = { email: "invalid-email" };

      // Act & Assert
      await assert.rejects(
        async () => {
          await controller.update(req, res, next);
        },
        {
          name: "ZodError",
        },
      );
    });

    test("Should return '200' status code when update is successful", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };
      req.body = { name: "Updated Name" };

      // Act
      await controller.update(req, res, next);

      // Assert
      assert.equal(res._getStatusCode(), 200);
    });

    test("Should update only provided fields", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      const originalEmail = mockUser.email;
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };
      req.body = { name: "Updated Name" };

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.equal(response.data.name, "Updated Name");
      assert.equal(response.data.email, originalEmail);
    });

    test("Should remove empty fields from update data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };
      req.body = { name: "Updated Name", email: "" };

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.equal(response.data.name, "Updated Name");
      assert.equal(response.data.email, mockUser.email);
    });

    test("Should exclude password field from response", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };
      req.body = { name: "Updated Name" };

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(
        !response.data.password,
        "Password should not be included in response",
      );
    });

    test("Should maintain existing fields when called with partial update", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      const originalData = { ...mockUser };
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };
      req.body = { name: "Updated Name" };

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.equal(response.data.name, "Updated Name");
      assert.equal(response.data.email, originalData.email);
      assert.equal(response.data.isAdmin, originalData.isAdmin);
    });

    test("Should throw 'ZodError' when called with invalid objectId format", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { userId: "invalid-id" };
      req.body = { name: "Updated Name" };

      // Act & Assert
      await assert.rejects(
        async () => {
          await controller.update(req, res, next);
        },
        (error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when called with invalid password format", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };
      req.body = { password: "123" }; // Too short password

      // Act & Assert
      await assert.rejects(
        async () => {
          await controller.update(req, res, next);
        },
        {
          name: "ZodError",
        },
      );
    });
  });

  describe("delete", () => {
    test("Should return success response when 'service.delete' is called with valid 'userId'", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.delete(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.equal(response.data, null);
    });

    test("Should return '204' status code when 'service.delete' is called with valid 'userId'", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.delete(req, res, next);

      // Assert
      assert.equal(res._getStatusCode(), 204);
    });

    test("Should throw 'NotFoundError' when user does not exist", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const nonExistentId = generateMockObjectId();
      req.params = { userId: nonExistentId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => {
          await controller.delete(req, res, next);
        },
        {
          name: "NotFoundError",
          message: "User not found",
        },
      );
    });

    test("Should remove user from database when delete is successful", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      await User.insertMany([mockUser]);
      req.params = { userId: mockUser._id.toString() };

      // Act
      await controller.delete(req, res, next);

      // Assert
      const deletedUser = await User.findById(mockUser._id);
      assert.equal(deletedUser, null, "User should be removed from database");
    });

    test("Should throw 'ZodError' when called with invalid objectId format", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { userId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => {
          await controller.delete(req, res, next);
        },
        (error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });
});
