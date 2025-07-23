import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { AuthController } from "../../controllers";
import { AuthenticationError } from "../../errors";
import User from "../../models/userModel";
import { AuthService } from "../../services";
import { generateMockUser } from "../mocks";
import { createMockExpressContext } from "../utils";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("Auth Controller 〖 Integration Tests 〗", () => {
  const service = new AuthService();
  const controller = new AuthController(service);

  before(async () => await connectTestDatabase());
  after(async () => await disconnectTestDatabase());

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("signup", () => {
    test("Should return success response when 'service.signup' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { req, res, next } = createMockExpressContext();
      req.body = mockUser;

      // Act
      await controller.signup(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '201' status code when 'service.signup' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { req, res, next } = createMockExpressContext();
      req.body = mockUser;

      // Act
      await controller.signup(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 201);
    });

    test("Should create user when 'service.signup' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { req, res, next } = createMockExpressContext();
      req.body = mockUser;
      mockUser.email = mockUser.email.toLowerCase();

      // Act
      await controller.signup(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(response.data._id);
      assert.strictEqual(response.data.name, mockUser.name);
      assert.strictEqual(response.data.email, mockUser.email);
      assert.strictEqual(response.data.isAdmin, mockUser.isAdmin);
      assert.ok(response.data.token);
    });

    test("Should throw 'ZodError' when 'service.signup' is called without required fields", async () => {
      // Arrange
      const { name, ...mockUser } = generateMockUser();
      const { req, res, next } = createMockExpressContext();
      req.body = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.signup(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "name");
          assert.strictEqual(error.errors[0].message, "Required");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.signup' is called with invalid email format", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = "invalid-email";
      const { req, res, next } = createMockExpressContext();
      req.body = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.signup(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "email");
          assert.strictEqual(error.errors[0].message, "Invalid email format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.signup' is called with invalid password format (too short)", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.password = "123"; // Too short
      const { req, res, next } = createMockExpressContext();
      req.body = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.signup(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "password");
          assert.ok(error.errors[0].message.includes("at least 6 characters"));
          return true;
        },
      );
    });

    test("Should throw 'AuthenticationError' when 'service.signup' is called with existing email", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { req, res, next } = createMockExpressContext();
      req.body = mockUser;

      // Create a user first
      await controller.signup(req, res, next);

      // Try to create another user with the same email
      const { req: req2, res: res2, next: next2 } = createMockExpressContext();
      req2.body = mockUser;

      // Act & Assert
      await assert.rejects(
        async () => await controller.signup(req2, res2, next2),
        (error: unknown) => {
          assert.ok(error instanceof AuthenticationError);
          assert.strictEqual(
            error.message,
            "An account with this email already exists.",
          );
          return true;
        },
      );
    });
  });

  describe("signin", () => {
    test("Should return success response when 'service.signin' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = mockUser.email.toLowerCase();
      await User.create(mockUser);

      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: mockUser.email,
        password: mockUser.password,
      };

      // Act
      await controller.signin(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.signin' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = mockUser.email.toLowerCase();
      await User.create(mockUser);

      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: mockUser.email,
        password: mockUser.password,
      };

      // Act
      await controller.signin(req, res, next);

      // Assert
      assert.strictEqual(res._getStatusCode(), 200);
    });

    test("Should return user data with JWT token when 'service.signin' is called with valid credentials", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = mockUser.email.toLowerCase();
      await User.create(mockUser);

      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: mockUser.email,
        password: mockUser.password,
      };

      // Act
      await controller.signin(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(response.data._id);
      assert.ok(response.data.token);
      assert.strictEqual(response.data.email, mockUser.email);
      assert.strictEqual(response.data.name, mockUser.name);
      assert.strictEqual(response.data.isAdmin, mockUser.isAdmin);
    });

    test("Should NOT return user password when 'service.signin' is called with valid credentials", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = mockUser.email.toLowerCase();
      await User.create(mockUser);

      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: mockUser.email,
        password: mockUser.password,
      };

      // Act
      await controller.signin(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(!("password" in response.data));
    });

    test("Should use 'res.locals.user' data when available instead of 'req.body'", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = mockUser.email.toLowerCase();
      await User.create(mockUser);

      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: "wrong@example.com",
        password: "wrong-123-password",
      };
      res.locals.user = mockUser;

      // Act
      await controller.signin(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.email, mockUser.email);
    });

    test("Should throw 'ZodError' when 'service.signin' is called without required fields", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.body = { email: "test@example.com" }; // Missing password

      // Act & Assert
      await assert.rejects(
        async () => await controller.signin(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "password");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.signin' is called with invalid email format", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: "invalid-email",
        password: "password123",
      };

      // Act & Assert
      await assert.rejects(
        async () => await controller.signin(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "email");
          assert.strictEqual(error.errors[0].message, "Invalid email format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'service.signin' is called with valid email but incorrect password format", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = mockUser.email.toLowerCase();
      await User.create(mockUser);

      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: mockUser.email,
        password: "short", // Invalid password format
      };

      // Act & Assert
      await assert.rejects(
        async () => await controller.signin(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "password");
          return true;
        },
      );
    });

    test("Should throw 'AuthenticationError' when 'service.signin' is called with non-existent email", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // Act & Assert
      await assert.rejects(
        async () => await controller.signin(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof AuthenticationError);
          assert.strictEqual(error.message, "Invalid email or password.");
          return true;
        },
      );
    });

    test("Should throw 'AuthenticationError' when 'service.signin' is called with incorrect password", async () => {
      // Arrange
      const mockUser = generateMockUser();
      mockUser.email = mockUser.email.toLowerCase();
      await User.create(mockUser);

      const { req, res, next } = createMockExpressContext();
      req.body = {
        email: mockUser.email,
        password: "wrong-123-password",
      };

      // Act & Assert
      await assert.rejects(
        async () => await controller.signin(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof AuthenticationError);
          assert.strictEqual(error.message, "Invalid email or password.");
          return true;
        },
      );
    });
  });
});
