import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { AuthController, UserController } from "../../controllers";
import { NotFoundError } from "../../errors";
import User from "../../models/userModel";
import { generateMockUser } from "../mocks";
import {
  connectTestDatabase,
  createMockExpressContext,
  disconnectTestDatabase,
} from "../utils";

before(async () => await connectTestDatabase());
after(async () => await disconnectTestDatabase());
beforeEach(async () => await User.deleteMany({}));

const userController = new UserController();
const authController = new AuthController();

// TODO: use 'supertest' to test the routes instead of controllers.

suite("User Integration Tests", () => {
  describe("User Lifecycle", () => {
    test("Should create, authenticate, and update user", async () => {
      const mockUser = generateMockUser();

      // Step 1: User signup
      const step1Signup = createMockExpressContext();
      step1Signup.req.body = mockUser;

      await authController.signup(
        step1Signup.req,
        step1Signup.res,
        step1Signup.next,
      );

      const step1Res = step1Signup.res._getJSONData();
      assert.ok(step1Res);
      assert.equal(step1Signup.res.statusCode, 201);
      assert.equal(step1Res.data.email, mockUser.email);

      // Step 2: User Signin
      const step2Signin = createMockExpressContext();
      step2Signin.req.body = {
        email: mockUser.email,
        password: mockUser.password,
      };

      await authController.signin(
        step2Signin.req,
        step2Signin.res,
        step2Signin.next,
      );

      const step2Res = step2Signin.res._getJSONData();
      assert.ok(step2Res);
      assert.equal(step2Signin.res.statusCode, 200);
      assert.equal(step2Res.data.email, mockUser.email);

      const token = step2Res.data.token;
      assert.ok(token);

      // Step 3: Get user profile
      const step3GetById = createMockExpressContext();
      step3GetById.req.params.userId = step1Res.data._id;

      await userController.getById(
        step3GetById.req,
        step3GetById.res,
        step3GetById.next,
      );

      const step3Res = step3GetById.res._getJSONData();
      assert.ok(step3Res);
      assert.equal(step3GetById.res.statusCode, 200);
      assert.equal(step3Res.data.email, mockUser.email);

      // Step 4: Update user profile
      const step4Update = createMockExpressContext();
      step4Update.req.params.userId = step1Res.data._id;
      step4Update.req.body = {
        name: "John Doe",
        email: "john.doe@gmail.com",
      };

      await userController.update(
        step4Update.req,
        step4Update.res,
        step4Update.next,
      );

      const step4Res = step4Update.res._getJSONData();
      assert.ok(step4Res);
      assert.equal(step4Update.res.statusCode, 200);
      assert.equal(step4Res.data.name, "John Doe");
      assert.equal(step4Res.data.email, "john.doe@gmail.com");

      // Step 5: Delete user profile
      const step5Delete = createMockExpressContext();
      step5Delete.req.params.userId = step1Res.data._id;

      await userController.delete(
        step5Delete.req,
        step5Delete.res,
        step5Delete.next,
      );

      const step5Res = step5Delete.res._getJSONData();
      assert.ok(step5Res);
      assert.equal(step5Delete.res.statusCode, 204);

      // Step 6: Try to get user profile
      const step6GetById = createMockExpressContext();
      step6GetById.req.params.userId = step1Res.data._id;

      try {
        await userController.getById(
          step6GetById.req,
          step6GetById.res,
          step6GetById.next,
        );
        assert.fail("Should throw 'NotFoundError'");
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "User not found");
      }
    });
  });
});
