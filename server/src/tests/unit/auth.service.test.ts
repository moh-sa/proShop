import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { DatabaseError } from "../../errors";
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

      const response = await authService.signup(mockUser);

      assert.ok(response.token);
      assert.equal(response.email, mockUser.email);
      assert.equal(response.name, mockUser.name);
      assert.ok(!Object.keys(response).includes("password"));
    });

    test("Should throw 'DatabaseError' if the user's email already exists", async () => {
      const mockUser = generateMockUser();

      await authService.signup(mockUser);
      try {
        // add duplicate user
        await authService.signup(mockUser);
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.statusCode, 500);
        assert.ok(error.message.includes("E11000")); // error code for duplication
      }
    });
  });

  describe("Signin User", () => {
    test("Should authenticate user and return user data and token", async () => {
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      const response = await authService.signin({
        email: user.email,
        password: user.password,
      });

      assert.ok(response.token);
      assert.equal(response.email, user.email);
    });
  });
});
