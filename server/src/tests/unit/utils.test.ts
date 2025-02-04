import assert from "node:assert";
import test, { describe, suite } from "node:test";
import { generateToken } from "../../utils/generateJwtToken";
import { verifyJwtToken } from "../../utils/verify-jwt-token.util";
import { mockUser1 } from "../mocks";

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
      const jwt = generateToken(mockUser1.insert);
      const token = verifyJwtToken<typeof mockUser1.insert>(jwt);

      assert.ok(token);
      assert.ok(Object.keys(token).length === 6);

      assert.equal(token.name, mockUser1.insert.name);
      assert.equal(token.email, mockUser1.insert.email);
      assert.equal(token.password, mockUser1.insert.password);
      assert.equal(token.isAdmin, mockUser1.insert.isAdmin);
    });
  });
});
