import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";
import {
  AuthenticationError,
  AuthorizationError,
  InvalidJwtTokenError,
  InvalidJwtTokenPayloadError,
} from "../../errors";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
  verifyReviewOwnership,
} from "../../middlewares";
import Review from "../../models/review.model";
import User from "../../models/userModel";
import { generateJwtToken } from "../../utils";
import {
  generateMockObjectId,
  generateMockSelectReview,
  generateMockUser,
} from "../mocks";
import {
  connectTestDatabase,
  createMockExpressContext,
  disconnectTestDatabase,
} from "../utils";

suite("Middlewares 〖 Integration Tests 〗", () => {
  before(async () => await connectTestDatabase());
  after(async () => await disconnectTestDatabase());
  beforeEach(async () => await User.deleteMany({}));
  describe("checkJwtTokenValidation", () => {
    test("Should parse JWT and set decoded data in 'res.locals.token'", async () => {
      const mockId = generateMockObjectId();
      const jwt = generateJwtToken({ _id: mockId });

      const { req, res, next } = createMockExpressContext();
      req.headers.authorization = `Bearer ${jwt}`;

      await checkJwtTokenValidation(req, res, next);

      assert.ok(res.locals.token);
      assert.equal(Object.keys(res.locals.token).length, 3);
      assert.equal(res.locals.token._id.toString(), mockId);
    });

    test("Should throw 'ZodError' if 'req.headers.authorization' is empty", async () => {
      const { req, res, next } = createMockExpressContext();

      await assert.rejects(
        async () => await checkJwtTokenValidation(req, res, next),
        (error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);

          assert.equal(error.issues[0].message, "Required");
          assert.equal(error.issues[0].code, "invalid_type");
          return true;
        },
      );
    });

    test("Should throw 'InvalidJwtTokenError' if JWT is invalid", async () => {
      const { req, res, next } = createMockExpressContext();

      req.headers.authorization = `Bearer RANDOM_STRING`;

      await assert.rejects(
        async () => await checkJwtTokenValidation(req, res, next),
        (error) => {
          assert.ok(error instanceof InvalidJwtTokenError);
          assert.strictEqual(error.message, "Invalid JWT token format");
          return true;
        },
      );
    });

    test("Should throw 'InvalidJwtTokenPayloadError' if userId is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      const jwt = generateJwtToken({ id: "RANDOM_STRING" });
      req.headers.authorization = `Bearer ${jwt}`;

      await assert.rejects(
        async () => await checkJwtTokenValidation(req, res, next),
        (error) => {
          assert.ok(error instanceof InvalidJwtTokenPayloadError);
          assert.strictEqual(error.message, "Invalid JWT token payload");
          return true;
        },
      );
    });
  });

  describe("checkUserIdExists", () => {
    test("Should find user by id and set res.locals.user", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      res.locals.token = { _id: user._id, iat: 123, exp: 456 };

      await checkUserIdExists(req, res, next);

      assert.ok(res.locals.user);
      assert.equal(res.locals.user._id.toString(), user._id.toString());
    });

    test("Should throw 'AuthenticationError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockId = generateMockObjectId();

      res.locals.token = { _id: mockId, iat: 123, exp: 456 };

      try {
        await checkUserIdExists(req, res, next);
      } catch (error) {
        assert.ok(error instanceof AuthenticationError);
        assert.equal(error.statusCode, 401);
        assert.equal(error.message, "Authentication required");
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

  describe("verifyReviewOwnership", () => {
    test("Should allow access if 'review.user' matches 'req.params.userId'", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      res.locals.user = mockUser;

      const mockReview = generateMockSelectReview();
      const created = await Review.create({
        ...mockReview,
        user: mockUser._id,
      });
      req.params.reviewId = created._id.toString();

      await verifyReviewOwnership(req, res, next);

      assert.equal(res.locals.review._id.toString(), mockReview._id.toString());
      assert.equal(res.locals.review.comment, mockReview.comment);
    });

    test("Should throw 'AuthorizationError' if user is not the owner", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();
      res.locals.user = mockUser;

      const mockReview = generateMockSelectReview();
      await Review.create(mockReview);
      req.params.reviewId = mockReview._id.toString();

      try {
        await verifyReviewOwnership(req, res, next);
        assert.fail("Should throw 'AuthorizationError'");
      } catch (error) {
        assert.ok(error instanceof AuthorizationError);
      }
    });
  });
});
