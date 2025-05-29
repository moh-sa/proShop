import assert from "node:assert";
import { describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { bearerTokenValidator } from "../../validators";

suite("Zod Schemas 〖 Unit Tests 〗", () => {
  describe("bearerTokenValidator", () => {
    test("Should return 'token123' when 'Bearer token123' is given", () => {
      const token = "Bearer token123";
      const expectedResult = "token123";

      const result = bearerTokenValidator.parse(token);

      assert.ok(result);
      assert.equal(result, expectedResult);
    });

    test("Should throw 'ZodError' when 'Bearer' is missing", () => {
      const token = "token";

      assert.throws(
        () => bearerTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].path[0], "Authorization");
          assert.ok(
            error.issues[0].message.includes("must start with 'Bearer '"),
          );

          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'bearer' is not capitalized", () => {
      const token = "bearer token";

      assert.throws(
        () => bearerTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].path[0], "Authorization");
          assert.ok(
            error.issues[0].message.includes("must start with 'Bearer '"),
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'Bearer-token' is given", () => {
      const token = "Bearer-token";

      assert.throws(
        () => bearerTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].path[0], "Authorization");
          assert.ok(
            error.issues[0].message.includes("must start with 'Bearer '"),
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'Bearer' is not followed by a space'", () => {
      const token = "Bearertoken123";

      assert.throws(
        () => bearerTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].path[0], "Authorization");
          assert.ok(
            error.issues[0].message.includes("must start with 'Bearer '"),
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'Bearer' is not followed by a token", () => {
      const token = "Bearer ";

      assert.throws(
        () => bearerTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].path[0], "Authorization");
          assert.ok(
            error.issues[0].message.includes("must start with 'Bearer '"),
          );
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'token123 Bearer' is given", () => {
      const token = "token123 Bearer";

      assert.throws(
        () => bearerTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].path[0], "Authorization");
          assert.ok(
            error.issues[0].message.includes("must start with 'Bearer '"),
          );
          return true;
        },
      );
    });
  });
});
