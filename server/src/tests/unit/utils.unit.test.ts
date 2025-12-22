import assert from "node:assert";
import test, { describe, suite } from "node:test";

import { ValidationError } from "../../errors/index.js";
import {
	formatZodErrors,
	fromCurrencySmallestUnit,
	getCurrencyFactor,
	toCurrencySmallestUnit,
	validateNumber,
} from "../../utils/index.js";
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

	describe("validateNumber", () => {
		test("Should return a number for numeric input", () => {
			// Arrange
			const input = 123;

			// Act
			const result = validateNumber(input);

			// Assert
			assert.strictEqual(result, input);
		});

		test("Should return a number for numeric string input", () => {
			// Arrange
			const input = "123";
			const expected = 123;

			// Act
			const result = validateNumber(input);

			// Assert
			assert.strictEqual(result, expected);
		});

		test("Should throw ValidationError for NaN input", () => {
			// Arrange
			const input = NaN;

			// Act & Assert
			assert.throws(() => validateNumber(input), ValidationError);
		});

		test("Should throw ValidationError for non-numeric input", () => {
			// Arrange
			const input = "123a";

			// Act & Assert
			assert.throws(() => validateNumber(input), ValidationError);
		});
	});

	describe("getCurrencyFactor", () => {
		test("Should return '100' for 'USD' currency", () => {
			// Act
			const result = getCurrencyFactor("USD");

			// Assert
			assert.strictEqual(result, 100);
		});

		test("Should return '1' for 'JPY' currency", () => {
			// Act
			const result = getCurrencyFactor("JPY");

			// Assert
			assert.strictEqual(result, 1);
		});

		test("Should throw 'ValidationError' for invalid currency code", () => {
			// Act & Assert
			assert.throws(() => getCurrencyFactor("INVALID"), ValidationError);
		});

		test("Should throw 'ValidationError' for something invalid", {
			skip: "I think this is type mismatch on typescript side",
		});

		test("Should throw 'InternalError' for unexpected error", {
			skip: "need node:test mock module",
		});
	});

	describe("toCurrencySmallestUnit", () => {
		test("Should convert '19.99' USD to '1999' cents", () => {
			// Arrange
			const amount = 19.99;
			const currency = "USD";
			const expected = 1999;

			// Act
			const result = toCurrencySmallestUnit({ amount, currency });

			// Assert
			assert.strictEqual(result, expected);
		});

		test("Should return '0' USD for '0' amount", () => {
			// Arrange
			const amount = 0;
			const currency = "USD";
			const expected = 0;

			// Act
			const result = toCurrencySmallestUnit({ amount, currency });

			// Assert
			assert.strictEqual(result, expected);
		});

		test("Should returns same amount for JPY (0 decimals)", () => {
			// Arrange
			const amount = 1999;
			const currency = "JPY";
			const expected = amount;

			// Act
			const result = toCurrencySmallestUnit({ amount, currency });

			// Assert
			assert.strictEqual(result, expected);
		});

		test("Should round to nearest smallest unit", () => {
			// Arrange
			const amount = 0.105;
			const currency = "USD";
			const expected = 11;

			// Act
			const result = toCurrencySmallestUnit({ amount, currency });

			// Assert
			assert.strictEqual(result, expected);
		});

		test("Should throw 'ValidationError' for invalid amount", () => {
			// Arrange
			const amount = "INVALID";
			const currency = "USD";

			// Act & Assert
			assert.throws(
				() =>
					toCurrencySmallestUnit({
						amount: amount as unknown as number,
						currency,
					}),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' for invalid currency", () => {
			// Arrange
			const amount = 19.99;
			const currency = "INVALID";

			// Act & Assert
			assert.throws(
				() => toCurrencySmallestUnit({ amount, currency }),
				ValidationError,
			);
		});
	});

	describe("fromCurrencySmallestUnit", () => {
		test("Should convert '1999' cents to '19.99' USD", () => {
			// Arrange
			const amount = 1999;
			const currency = "USD";
			const expected = 19.99;

			// Act
			const result = fromCurrencySmallestUnit({ amount, currency });

			// Assert
			assert.strictEqual(result, expected);
		});

		test("Should convert '0' cents to '0' USD", () => {
			// Arrange
			const amount = 0;
			const currency = "USD";
			const expected = 0;

			// Act
			const result = fromCurrencySmallestUnit({ amount, currency });

			// Assert
			assert.strictEqual(result, expected);
		});

		test("Should convert '1999' JPY to '1999' JPY", () => {
			// Arrange
			const amount = 1999;
			const currency = "JPY";
			const expected = amount;

			// Act
			const result = fromCurrencySmallestUnit({ amount, currency });

			// Assert
			assert.strictEqual(result, expected);
		});

		test("Should throw 'ValidationError' for invalid amount", () => {
			// Arrange
			const amount = "INVALID";
			const currency = "USD";

			// Act & Assert
			assert.throws(
				() =>
					fromCurrencySmallestUnit({
						amount: amount as unknown as number,
						currency,
					}),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' for invalid currency", () => {
			// Arrange
			const amount = 1999;
			const currency = "INVALID";

			// Act & Assert
			assert.throws(
				() => fromCurrencySmallestUnit({ amount, currency }),
				ValidationError,
			);
		});
	});
});
