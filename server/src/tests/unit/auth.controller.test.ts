import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { authController } from "../../controllers";
import { ConflictError } from "../../errors";
import User from "../../models/userModel";
import { generateMockUser } from "../mocks";
import { createMockExpressContext, dbClose, dbConnect } from "../utils";

const controller = authController;
before(async () => dbConnect());
after(async () => dbClose());
beforeEach(async () => await User.deleteMany({}));

suite("Auth Controller", () => {
  describe("Signup User", () => {
    test("Should register a user and return 201 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      req.body = mockUser;

      await controller.signup(req, res, next);

      const { data } = res._getJSONData();
      assert.equal(res.statusCode, 201);
      assert.equal(data.name, mockUser.name);
      assert.equal(data.email, mockUser.email);
    });

    test("Should throw 'ConflictError' if user already exists", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      await User.create(mockUser);
      req.body = mockUser;
      try {
        await controller.signup(req, res, next);
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
    test("Should authenticate a user and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      await User.create(mockUser);
      res.locals.user = mockUser;

      await controller.signin(req, res, next);

      const { data } = res._getJSONData();
      assert.equal(res.statusCode, 200);
      assert.equal(data.email, mockUser.email);
    });
  });
});
