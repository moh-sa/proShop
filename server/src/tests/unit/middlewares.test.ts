import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";
import { checkJwtTokenValidation } from "../../middlewares";
import User from "../../models/userModel";
import { generateToken } from "../../utils";
import { mockObjectid1 } from "../mocks";
import { createMockExpressContext, dbClose, dbConnect } from "../utils";

before(async () => await dbConnect());
after(async () => await dbClose());
beforeEach(async () => await User.deleteMany({}));

suite("Middlewares Unit Tests", () => {
  describe("checkJwtTokenValidation", () => {
    test("Should parse JWT and set set decoded data in res.locals.token", async () => {
      const { req, res, next } = createMockExpressContext();
      const jwt = generateToken({ id: mockObjectid1 });

      req.headers.authorization = `Bearer ${jwt}`;

      // Ensure the res.locals.token is undefined
      assert.equal(res.locals.token, undefined);

      await checkJwtTokenValidation(req, res, next);

      assert.ok(res.locals.token);
      assert.equal(Object.keys(res.locals.token).length, 3);
      assert.equal(res.locals.token.id.toString(), mockObjectid1);
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
});
