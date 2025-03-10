import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ConflictError } from "../../errors";
import User from "../../models/userModel";
import { authService } from "../../services";
import { generateMockUser } from "../mocks";
import { dbClose, dbConnect } from "../utils";

const service = authService;
before(async () => await dbConnect());
after(async () => await dbClose());
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
  });
});
