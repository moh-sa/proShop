import assert from "node:assert";
import test, { describe, suite } from "node:test";
import { formatZodErrors } from "../../utils";
import { generateToken } from "../../utils/generateJwtToken";
import { verifyJwtToken } from "../../utils/verify-jwt-token.util";
import { generateMockUser, mockZodError1, mockZodErrors } from "../mocks";

suite("Util Functions Unit Tests", () => {
  describe("verifyJwtToken", () => {
    test("Should return string id", () => {
      const jwt = generateToken({ id: "RANDOM_ID" });
      const token = verifyJwtToken(jwt);

      assert.ok(token);
      assert.ok(Object.keys(token).length === 3);

      assert.equal(token.id, "RANDOM_ID");
    });

    test("Should return user data object", () => {
      const mockUser = generateMockUser();

      const jwt = generateToken(mockUser);
      const token = verifyJwtToken<typeof mockUser>(jwt);

      assert.ok(token);
      assert.ok(Object.keys(token).length === 10);

      assert.equal(token.name, mockUser.name);
      assert.equal(token.email, mockUser.email);
      assert.equal(token.password, mockUser.password);
      assert.equal(token.isAdmin, mockUser.isAdmin);
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
