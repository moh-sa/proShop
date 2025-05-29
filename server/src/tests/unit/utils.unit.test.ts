import { faker } from "@faker-js/faker";
import jwt from "jsonwebtoken";
import assert from "node:assert";
import test, { describe, suite } from "node:test";
import { z } from "zod";
import {
  InvalidJwtTokenError,
  InvalidJwtTokenPayloadError,
  JwtTokenExpiredError,
} from "../../errors";
import { selectUserSchema } from "../../schemas";
import { formatZodErrors, verifyJwtToken } from "../../utils";
import { generateMockUser, mockZodError1, mockZodErrors } from "../mocks";

suite("Util Functions Unit Tests", () => {
  describe("verifyJwtToken", () => {
    test("Should return 'iat' and 'exp' when 'verifyJwtToken' is called with standard 'token'", (t) => {
      const mockToken = faker.internet.jwt();
      const expectedResult = {
        iat: 1689120000,
        exp: 1689120000,
      };

      t.mock.method(jwt, "verify", () => expectedResult);

      const payload = verifyJwtToken(mockToken);

      assert.ok(payload);
      assert.deepStrictEqual(payload, expectedResult);
    });

    test("Should return 'id', 'iat' and 'exp' when 'verifyJwtToken' is called with custom 'token' and 'payload schema'", (t) => {
      const mockId = faker.string.uuid();
      const mockPayload = { id: mockId };
      const mockToken = faker.internet.jwt({ payload: mockPayload });
      const schema = z.object({ id: z.string() });
      const expectedResult = {
        iat: 1689120000,
        exp: 1689120000,
        id: mockId,
      };

      t.mock.method(jwt, "verify", () => expectedResult);

      const payload = verifyJwtToken(mockToken, schema);

      assert.ok(payload);
      assert.deepStrictEqual(payload, expectedResult);
    });

    test("Should return 'user object', 'iat' and 'exp' when 'verifyJwtToken' is called with custom 'token' and 'payload schema'", (t) => {
      const mockUser = generateMockUser();
      const mockPayload = {
        _id: mockUser._id,
        email: mockUser.email.toLowerCase(),
        isAdmin: mockUser.isAdmin,
      };
      const mockToken = faker.internet.jwt({ payload: mockPayload });
      const expectedResult = {
        iat: 1689120000,
        exp: 1689120000,
        ...mockPayload,
      };
      const schema = selectUserSchema.pick({
        _id: true,
        email: true,
        isAdmin: true,
      });

      t.mock.method(jwt, "verify", () => expectedResult);

      const token2 = verifyJwtToken(mockToken, schema);

      assert.ok(token2);
      assert.deepStrictEqual(token2, expectedResult);
    });

    test("Should throw 'InvalidJwtTokenError' when 'verifyJwtToken' is called with invalid 'token'", () => {
      const mockToken = "invalid-token";

      assert.throws(() => verifyJwtToken(mockToken), InvalidJwtTokenError);
    });

    test("Should throw 'InvalidJwtTokenPayloadError' when 'verifyJwtToken' is called with a wrong 'payload schema'", (t) => {
      const mockPayload = { id: "random-id" };
      const verifyResult = { ...mockPayload, iat: 1689120000, exp: 1689120000 };
      const mockToken = faker.internet.jwt({ payload: mockPayload });
      const mockSchema = z.object({ email: z.string() });

      t.mock.method(jwt, "verify", () => verifyResult);

      assert.throws(
        () => verifyJwtToken(mockToken, mockSchema),
        InvalidJwtTokenPayloadError,
      );
    });

    test("Should throw 'JwtTokenExpiredError' when 'verifyJwtToken' is called with 'expired' token", (t) => {
      const mockPayload = { exp: new Date().getTime() - 1000 };
      const mockToken = faker.internet.jwt({
        payload: mockPayload,
      });

      t.mock.method(jwt, "verify", () => {
        throw new jwt.TokenExpiredError("JWT expired", new Date());
      });

      assert.throws(() => verifyJwtToken(mockToken), JwtTokenExpiredError);
    });
  });

  describe("formatZodErrors", () => {
    test("Should return 1 error required name", () => {
      //@ts-expect-error - it expect the full ZodError object.
      const result = formatZodErrors(mockZodError1);
      assert.ok(result);
      assert.equal(result, "user.name Name is required");
    });

    test("Should return 3 errors", () => {
      //@ts-expect-error - it expect the full ZodError object.
      const result = formatZodErrors(mockZodErrors);
      assert.ok(result);
      const errors = result.split("; ");
      assert.equal(errors.length, 3);
      assert.equal(errors[0], "user.name Name is required");
      assert.equal(errors[1], "user.email Invalid email format");
      assert.equal(
        errors[2],
        "user.password Password should be at least 6 characters long",
      );
    });
  });
});
