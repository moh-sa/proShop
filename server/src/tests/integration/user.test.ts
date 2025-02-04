import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { userController } from "../../controllers";
import {
  checkEmailExists,
  checkJwtTokenValidation,
  checkPasswordValidation,
  checkUserIdExists,
} from "../../middlewares";
import User from "../../models/userModel";
import { SelectUser } from "../../types";
import { generateToken } from "../../utils";
import { mockUser1, mockUser2 } from "../mocks";
import { createMockExpressContext, dbClose, dbConnect } from "../utils";

before(async () => await dbConnect());
after(async () => await dbClose());
beforeEach(async () => await User.deleteMany({}));

suite("User Integration Tests", () => {
  const controller = userController;

  describe("User Lifecycle", () => {
    test("Should create, authenticate, and update user", async () => {
      // 1) Signup
      const step1 = createMockExpressContext();
      // 1.1) Check if user exists
      step1.req.body.email = mockUser1.insert.email;
      checkEmailExists()(step1.req, step1.res, step1.next);

      // 1.2) Create user
      const user = await User.create(mockUser1.insert);
      assert.ok(user);
      assert.ok(user._id);
      assert.equal(user.email, mockUser1.insert.email);

      // 2) Generate JWT
      const jwt = generateToken({ id: user._id });
      assert.ok(jwt);

      // 3) Signin
      const step3 = createMockExpressContext();
      // 3.1) Check if user exists
      step3.req.body.email = user.email;
      await checkEmailExists(true)(step3.req, step3.res, step3.next);

      // 3.2) Match passwords
      step3.req.body.password = mockUser1.insert.password;
      step3.res.locals.user.password = user.password;
      await checkPasswordValidation(step3.req, step3.res, step3.next);

      // 3.3) Signin
      step3.res.locals.user = user;
      await controller.signin(step3.req, step3.res, step3.next);
      const signinResponse = step3.res._getJSONData() as SelectUser;
      assert.ok(signinResponse);
      assert.equal(signinResponse.email, user.email);
      assert.ok(signinResponse.token);

      // 4) Get user profile
      const call4 = createMockExpressContext();
      // 4.1) extract and validate JWT
      call4.req.headers.authorization = `Bearer ${jwt}`;
      checkJwtTokenValidation(call4.req, call4.res, call4.next);

      // 4.2) Check if user exists
      await checkUserIdExists(call4.req, call4.res, call4.next);

      // 4.3) Fetch the user data
      await controller.getById(call4.req, call4.res, call4.next);
      const profileResponse = call4.res._getJSONData() as SelectUser;
      assert.ok(profileResponse);
      assert.equal(profileResponse.email, user.email);

      // 5) Update user
      const call5 = createMockExpressContext();
      // 5.1) extract and validate JWT
      call5.req.headers.authorization = `Bearer ${jwt}`;
      await checkJwtTokenValidation(call5.req, call5.res, call5.next);

      // 5.2) Check if user exists
      await checkUserIdExists(call5.req, call5.res, call5.next);

      // 5.3) update
      call5.req.body.name = mockUser2.insert.name;
      await controller.update(call5.req, call5.res, call5.next);
      const updatedData = call5.res._getJSONData() as SelectUser;
      assert.ok(updatedData);
      assert.equal(updatedData.name, mockUser2.insert.name);
    });
  });
});
