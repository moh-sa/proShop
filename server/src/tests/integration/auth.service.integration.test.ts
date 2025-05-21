import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ConflictError, ValidationError } from "../../errors";
import User from "../../models/userModel";
import { AuthService } from "../../services";
import { generateMockUser } from "../mocks";
import { connectTestDatabase, disconnectTestDatabase } from "../utils";

const service = new AuthService();
before(async () => await connectTestDatabase());
after(async () => await disconnectTestDatabase());
beforeEach(async () => await User.deleteMany({}));

suite("Auth Service", () => {
  describe("Signup User", () => {
    test("Should register a new user and return user data with token and without password", async () => {
      const mockUser = generateMockUser();

      const response = await service.signup(mockUser);

      assert.ok(response);
      assert.equal(response.name, mockUser.name);
      assert.equal(response.email, mockUser.email);
      assert.ok(response.token);
      assert.ok(!Object.keys(response).includes("password"));
    });

    test("Should throw 'ConflictError' if user already exists", async () => {
      const mockUser = generateMockUser();
      await User.create(mockUser);

      try {
        await service.signup(mockUser);
        assert.fail("Should throw 'ConflictError'");
      } catch (error) {
        assert.ok(error instanceof ConflictError);
        assert.equal(error.statusCode, 409);
        assert.equal(
          error.message,
          "An account with this email already exists.",
        );
      }
    });
  });

  describe("Signin User", () => {
    test("Should authenticate user and return user data with token and without password", async () => {
      const mockUser = generateMockUser();
      await User.create(mockUser);

      const response = await service.signin({
        email: mockUser.email,
        password: mockUser.password,
      });

      assert.ok(response);
      assert.equal(response.name, mockUser.name);
      assert.equal(response.email, mockUser.email);
      assert.ok(response.token);
      assert.ok(!Object.keys(response).includes("password"));
    });

    test("Should throw 'ConflictError' if email does not exist", async () => {
      try {
        await service.signin({
          email: "test@test.com",
          password: "test",
        });
        assert.fail("Should throw 'ConflictError'");
      } catch (error) {
        assert.ok(error instanceof ConflictError);
        assert.equal(error.statusCode, 409);
        assert.equal(error.message, "Invalid email or password.");
      }
    });

    test("Should throw 'ValidationError' if password does not match", async () => {
      const mockUser = generateMockUser();
      await User.create(mockUser);

      try {
        await service.signin({
          email: mockUser.email,
          password: "INVALID_PASSWORD",
        });
        assert.fail("Should throw 'ValidationError'");
      } catch (error) {
        assert.ok(error instanceof ValidationError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.message, "Invalid email or password.");
      }
    });
  });
});
