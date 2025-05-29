import { faker } from "@faker-js/faker";
import { Types } from "mongoose";
import assert from "node:assert";
import { describe, suite, test } from "node:test";
import { ZodError } from "zod";
import {
  bearerTokenValidator,
  emailValidator,
  jwtTokenValidator,
  objectIdValidator,
} from "../../validators";

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

  describe("emailValidator", () => {
    test("Should return 'user@example.com'", () => {
      const email = "user@example.com";

      const result = emailValidator.parse(email);

      assert.ok(result);
      assert.equal(result, email);
    });

    test("Should return trimmed email when '  user@example.com  ' is given", () => {
      const email = "  user@example.com  ";

      const result = emailValidator.parse(email);

      assert.ok(result);
      assert.equal(result, email.trim());
    });

    test("Should return lowercase email when 'USER@EXAMPLE.COM' is given", () => {
      const email = "USER@EXAMPLE.COM";

      const result = emailValidator.parse(email);

      assert.ok(result);
      assert.equal(result, email.toLowerCase());
    });

    test("Should return 'user@example.co'", () => {
      const email = "user@example.co";

      const result = emailValidator.parse(email);

      assert.ok(result);
      assert.equal(result, email);
    });

    test("Should return 'user.label@example.com'", () => {
      const email = "user.label@example.com";

      const result = emailValidator.parse(email);

      assert.ok(result);
      assert.equal(result, email);
    });

    test("Should return 'user+label@example.com'", () => {
      const email = "user+label@example.com";

      const result = emailValidator.parse(email);

      assert.ok(result);
      assert.equal(result, email);
    });

    test("Should throw 'ZodError' when 'empty string' is given", () => {
      const email = "";

      assert.throws(
        () => emailValidator.parse(email),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 2);
          assert.equal(error.issues[0].message, "Email is required.");
          assert.equal(error.issues[1].message, "Invalid email format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when '   ' is given", () => {
      const email = "   ";

      assert.throws(
        () => emailValidator.parse(email),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 2);
          assert.equal(error.issues[0].message, "Email is required.");
          assert.equal(error.issues[1].message, "Invalid email format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'user@' is given", () => {
      const email = "user@";

      assert.throws(
        () => emailValidator.parse(email),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid email format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when '@example.com' is given", () => {
      const email = "@example.com";

      assert.throws(
        () => emailValidator.parse(email),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid email format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'userexample.com' is given", () => {
      const email = "userexample.com";

      assert.throws(
        () => emailValidator.parse(email),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid email format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'not-an-email' is given", () => {
      const email = "not-an-email";

      assert.throws(
        () => emailValidator.parse(email),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid email format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'u$er@e𝕏ample' is given", () => {
      const email = "u$er@e𝕏ample";

      assert.throws(
        () => emailValidator.parse(email),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid email format.");
          return true;
        },
      );
    });
  });

  describe("jwtTokenValidator", () => {
    test("Should return the same JWT token as given", () => {
      const token = faker.internet.jwt();

      const result = jwtTokenValidator.parse(token);

      assert.ok(result);
      assert.equal(result, token);
    });

    test("Should return jwt token without whitespace", () => {
      const token = `   ${faker.internet.jwt()}   `;

      const result = jwtTokenValidator.parse(token);

      assert.ok(result);
      assert.equal(result, token.trim());
    });

    test("Should throw 'ZodError' when 'empty string' is given", () => {
      const token = "";

      assert.throws(
        () => jwtTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 2);
          assert.equal(error.issues[0].message, "Token is required.");
          assert.equal(error.issues[1].message, "Invalid jwt token format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'whitespace-only' is given", () => {
      const token = "   ";

      assert.throws(
        () => jwtTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 2);
          assert.equal(error.issues[0].message, "Token is required.");
          assert.equal(error.issues[1].message, "Invalid jwt token format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'invalid jwt token' is given", () => {
      const jwt = faker.internet.jwt();
      const token = jwt.slice(0, 10) + "#$%" + jwt.slice(10);

      assert.throws(
        () => jwtTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid jwt token format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'not-a-jwt-token' is given", () => {
      const token = "not-a-jwt-token";

      assert.throws(
        () => jwtTokenValidator.parse(token),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid jwt token format.");
          return true;
        },
      );
    });
  });

  describe("objectIdValidator", () => {
    test("Should return 'Types.ObjectId' when a ObjectId is given", () => {
      const id = new Types.ObjectId();

      const result = objectIdValidator.parse(id);

      assert.ok(result);
      assert.equal(result, id);
    });

    test("Should return 'Types.ObjectId' when a ObjectId string is given", () => {
      const id = new Types.ObjectId().toString();

      const result = objectIdValidator.parse(id);

      assert.ok(result);
      assert.equal(result.toString(), id);
    });

    test("Should return 'Types.ObjectId' when a ObjectId string with whitespace is given", () => {
      const id = `   ${new Types.ObjectId().toString()}   `;

      const result = objectIdValidator.parse(id);

      assert.ok(result);
      assert.equal(result.toString(), id.trim());
    });

    test("Should throw 'ZodError' when 'empty string' is given", () => {
      const id = "";

      assert.throws(
        () => objectIdValidator.parse(id),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid ObjectId format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'whitespace-only' is given", () => {
      const id = "   ";

      assert.throws(
        () => objectIdValidator.parse(id),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid ObjectId format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'invalid ObjectId' is given", () => {
      const ogId = new Types.ObjectId();
      const id =
        ogId.toString().slice(0, 10) + "#$%" + ogId.toString().slice(10);

      assert.throws(
        () => objectIdValidator.parse(id),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid ObjectId format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when 'not-a-object-id' is given", () => {
      const id = "not-a-ObjectId";

      assert.throws(
        () => objectIdValidator.parse(id),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid ObjectId format.");
          return true;
        },
      );
    });

    test("Should throw 'ZodError' when a number is given", () => {
      const id = 123;

      assert.throws(
        () => objectIdValidator.parse(id),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.equal(error.issues.length, 1);
          assert.equal(error.issues[0].message, "Invalid ObjectId format.");
          return true;
        },
      );
    });
  });
});
