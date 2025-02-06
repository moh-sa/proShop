import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "../../errors";
import {
  checkEmailExists,
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
} from "../../middlewares";
import User from "../../models/userModel";
import { generateToken } from "../../utils";
import { generateMockObjectId, generateMockUser } from "../mocks";
import { createMockExpressContext, dbClose, dbConnect } from "../utils";

before(async () => await dbConnect());
after(async () => await dbClose());
beforeEach(async () => await User.deleteMany({}));

suite("Middlewares Unit Tests", () => {
  describe("checkJwtTokenValidation", () => {
    test("Should parse JWT and set set decoded data in res.locals.token", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();
      const jwt = generateToken({ id: mockId });

      req.headers.authorization = `Bearer ${jwt}`;

      // Ensure the res.locals.token is undefined
      assert.equal(res.locals.token, undefined);

      await checkJwtTokenValidation(req, res, next);

      assert.ok(res.locals.token);
      assert.equal(Object.keys(res.locals.token).length, 3);
      assert.equal(res.locals.token.id.toString(), mockId);
    });

    test("Should throw 'ZodError' if req.headers.authorization is empty", async () => {
      const { req, res, next } = createMockExpressContext();

      try {
        await checkJwtTokenValidation(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);

        assert.equal(error.issues[0].message, "Required");
        assert.equal(error.issues[0].code, "invalid_type");
      }
    });

    test("Should throw 'ZodError' if JWT is invalid", async () => {
      const { req, res, next } = createMockExpressContext();

      req.headers.authorization = `Bearer RANDOM_STRING`;

      try {
        await checkJwtTokenValidation(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid jwt token format.");
      }
    });

    test("Should throw 'ZodError' if userId is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const jwt = generateToken({ id: "RANDOM_STRING" });
      req.headers.authorization = `Bearer ${jwt}`;

      try {
        await checkJwtTokenValidation(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("checkUserIdExists", () => {
    test("Should find user by id and set res.locals.user", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      res.locals.token = { id: user._id, iat: 123, exp: 456 };

      await checkUserIdExists(req, res, next);

      assert.ok(res.locals.user);
      assert.equal(res.locals.user._id.toString(), user._id.toString());
    });

    test("Should throw 'AuthenticationError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      res.locals.token = { id: mockId, iat: 123, exp: 456 };

      try {
        await checkUserIdExists(req, res, next);
      } catch (error) {
        assert.ok(error instanceof AuthenticationError);
        assert.equal(error.statusCode, 401);
        assert.equal(error.message, "Authentication required");
      }
    });
  });

  describe("checkEmailExists", () => {
    test("Should find user by email and set res.locals.user", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      req.body.email = user.email;

      await checkEmailExists(true)(req, res, next);

      assert.ok(res.locals.user);
      assert.equal(res.locals.user._id.toString(), user._id.toString());
    });

    test("Should find user by email and throw 'ConflictError' if allowExisting is false", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      req.body.email = user.email;

      try {
        await checkEmailExists(false)(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ConflictError);
        assert.equal(error.statusCode, 409);
        assert.equal(
          error.message,
          "An account with this email already exists.",
        );
      }
    });

    test("Should throw 'ZodError' if email is invalid", async () => {
      const { req, res, next } = createMockExpressContext();
      req.body.email = "RANDOM_EMAIL";

      try {
        await checkEmailExists()(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid email format.");
      }
    });

    test("Should throw 'NotFoundError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      req.body.email = mockUser.email;

      try {
        await checkEmailExists()(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "User not found");
      }
    });
  });

  describe("checkIfUserIsAdmin", () => {
    test("Should allow admin access", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser(true);

      res.locals.user = mockUser;

      await checkIfUserIsAdmin(req, res, next);
    });

    test("Should throw 'AuthorizationError' if user is not admin", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser(true);

      res.locals.user = mockUser;

      try {
        await checkIfUserIsAdmin(req, res, next);
      } catch (error) {
        assert.ok(error instanceof AuthorizationError);
        assert.equal(error.statusCode, 403);
        assert.equal(error.message, "Admin access required.");
      }
    });
  });
});
