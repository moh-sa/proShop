import assert from "node:assert";
import test, { describe, suite } from "node:test";

import { formatZodErrors } from "../../utils/index.js";
import { mockZodError1, mockZodErrors } from "../mocks/index.js";

suite("Util Functions Unit Tests", () => {
	describe("formatZodErrors", () => {
		test("Should return 1 error required name", () => {
			// Arrange
			//@ts-expect-error - it expect the full ZodError object.
			const result = formatZodErrors(mockZodError1);

			// Act & Assert
			assert.ok(result);
			assert.equal(result, "user.name Name is required");
		});

		test("Should return 3 errors", () => {
			// Arrange
			//@ts-expect-error - it expect the full ZodError object.
			const result = formatZodErrors(mockZodErrors);

			// Act
			const errors = result.split("; ");

			// Assert
			assert.ok(result);
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
