import test, { describe, suite } from "node:test";

suite(
  "Middlewares 〖 Unit Tests 〗",
  {
    todo: "waiting 'mock.module' to be stable...",
  },
  () => {
    describe("checkJwtTokenValidation", { skip: true }, () => {
      test(
        "Should call 'bearerTokenValidator' once with the 'authorization' header",
      );

      test(
        "Should throw 'ZodError' when 'bearerTokenValidator' is called with invalid 'authorization' header",
      );

      test(
        "Should call 'verifyJwtToken' once with the parsed 'auth header' and 'schema'",
      );

      test(
        "Should throw 'ZodError' when 'verifyJwtToken' is called with 'auth header' that does not match the 'schema'",
      );

      test("Should call 'objectIdValidator' once with a valid ObjectId");

      test(
        "Should throw 'ZodError' when 'objectIdValidator' is called with invalid ObjectId",
      );
    });

    describe("checkUserIdExists", { skip: true }, () => {});

    describe("checkIfUserIsAdmin", { skip: true }, () => {});

    describe("verifyReviewOwnership", { skip: true }, () => {});

    describe("checkProductReviewedByUser", { skip: true }, () => {});

    describe("RateLimiterMiddleware", { skip: true }, () => {});

    describe("errorHandlerMiddleware", { skip: true }, () => {});
  },
);
