import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";

import type * as Argon2 from "argon2";

import {
	MAX_PASSWORD_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "../../constants/index.js";
import {
	PasswordHashError,
	PasswordMismatchError,
	PasswordValidationError,
	PasswordVerifyError,
} from "../../errors/index.js";
import { PasswordService } from "../../services/index.js";
import { mockArgon2 } from "../mocks/index.js";

suite("Password Service 〖 Unit Tests 〗", () => {
	const mockProvider = mockArgon2();
	const service = new PasswordService(mockProvider as unknown as typeof Argon2);

	beforeEach(() => mockProvider.reset());

	describe("hash", () => {
		it("should successfully hash a valid password", async () => {
			// Arrange
			const password = "validPassword123";
			const expectedHash = "hashed-password";
			mockProvider.hash.mock.mockImplementation(() =>
				Promise.resolve(expectedHash),
			);

			// Act
			const result = await service.hash({ password });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, expectedHash);

			assert.strictEqual(mockProvider.hash.mock.callCount(), 1);
			assert.deepStrictEqual(mockProvider.hash.mock.calls[0].arguments, [
				password,
			]);
			assert.strictEqual(mockProvider.verify.mock.callCount(), 0);
		});

		it("should fail when password is empty string", async () => {
			// Arrange
			const password = "";

			// Act
			const result = await service.hash({ password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					`Password should be at least ${MIN_PASSWORD_LENGTH} characters long.`,
				),
			);

			// Hash method should not be called
			assert.strictEqual(mockProvider.hash.mock.callCount(), 0);
		});

		it("should fail when password is whitespace only", async () => {
			// Arrange
			const password = "   \t   ";

			// Act
			const result = await service.hash({ password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					`Password should be at least ${MIN_PASSWORD_LENGTH} characters long.`,
				),
			);

			// Hash method should not be called
			assert.strictEqual(mockProvider.hash.mock.callCount(), 0);
		});

		it("should fail when password length is below minimum", async () => {
			// Arrange
			const password = "a".repeat(MIN_PASSWORD_LENGTH - 1);

			// Act
			const result = await service.hash({ password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					`Password should be at least ${MIN_PASSWORD_LENGTH} characters long.`,
				),
			);

			// Hash method should not be called
			assert.strictEqual(mockProvider.hash.mock.callCount(), 0);
		});

		it("should fail when password length exceeds maximum", async () => {
			// Arrange
			const password = "a".repeat(MAX_PASSWORD_LENGTH + 1);

			// Act
			const result = await service.hash({ password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					`Password should be at most ${MAX_PASSWORD_LENGTH} characters long.`,
				),
			);

			// Hash method should not be called
			assert.strictEqual(mockProvider.hash.mock.callCount(), 0);
		});

		it("should fail when hashing method throws an error", async () => {
			// Arrange
			const password = "validPassword123";
			mockProvider.hash.mock.mockImplementation(() => {
				throw new Error("hash failed");
			});

			// Act
			const result = await service.hash({ password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordHashError);
			assert(result.error.message.includes("Failed to hash password"));
			assert.strictEqual(mockProvider.hash.mock.callCount(), 1);
		});
	});

	describe("verify", () => {
		it("should successfully verify when verify method returns true", async () => {
			// Arrange
			const hashedPassword = "hashed";
			const password = "validPassword123";
			mockProvider.verify.mock.mockImplementation(() => Promise.resolve(true));

			// Act
			const result = await service.verify({ hashedPassword, password });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(mockProvider.verify.mock.callCount(), 1);
			assert.deepStrictEqual(mockProvider.verify.mock.calls[0].arguments, [
				hashedPassword,
				password,
			]);
			assert.strictEqual(mockProvider.hash.mock.callCount(), 0);
		});

		it("should fail when verify method returns false (invalid password)", async () => {
			// Arrange
			const hashedPassword = "hashed";
			const password = "validPassword123";
			mockProvider.verify.mock.mockImplementation(() => Promise.resolve(false));

			// Act
			const result = await service.verify({ hashedPassword, password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordMismatchError);
			assert.strictEqual(mockProvider.verify.mock.callCount(), 1);
		});

		it("should fail when verify method throws an error", async () => {
			// Arrange
			const hashedPassword = "hashed";
			const password = "validPassword123";
			mockProvider.verify.mock.mockImplementation(() => {
				throw new Error("verify failed");
			});

			// Act
			const result = await service.verify({ hashedPassword, password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordVerifyError);
			assert(result.error.message.includes("Failed to verify password"));
			assert.strictEqual(mockProvider.verify.mock.callCount(), 1);
		});

		it("should fail when hashedPassword is empty string", async () => {
			// Arrange
			const hashedPassword = "";
			const password = "validPassword123";

			// Act
			const result = await service.verify({ hashedPassword, password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					"hashedPassword Hashed password cannot be empty",
				),
			);

			// Verify method should not be called
			assert.strictEqual(mockProvider.verify.mock.callCount(), 0);
		});

		it("should fail when hashedPassword is whitespace only", async () => {
			// Arrange
			const hashedPassword = "   \t  ";
			const password = "validPassword123";

			// Act
			const result = await service.verify({ hashedPassword, password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					"hashedPassword Hashed password cannot be empty",
				),
			);

			// Verify method should not be called
			assert.strictEqual(mockProvider.verify.mock.callCount(), 0);
		});

		it("should fail when password is empty string", async () => {
			// Arrange
			const hashedPassword = "hashed";
			const password = "";

			// Act
			const result = await service.verify({ hashedPassword, password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					`password Password should be at least ${MIN_PASSWORD_LENGTH} characters long.`,
				),
			);

			// Verify method should not be called
			assert.strictEqual(mockProvider.verify.mock.callCount(), 0);
		});

		it("should fail when password is below minimum length", async () => {
			// Arrange
			const hashedPassword = "hashed";
			const password = "a".repeat(MIN_PASSWORD_LENGTH - 1);

			// Act
			const result = await service.verify({ hashedPassword, password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					`password Password should be at least ${MIN_PASSWORD_LENGTH} characters long.`,
				),
			);

			// Verify method should not be called
			assert.strictEqual(mockProvider.verify.mock.callCount(), 0);
		});

		it("should fail when password exceeds maximum length", async () => {
			// Arrange
			const hashedPassword = "hashed";
			const password = "a".repeat(MAX_PASSWORD_LENGTH + 1);

			// Act
			const result = await service.verify({ hashedPassword, password });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof PasswordValidationError);
			assert(
				result.error.message.includes(
					`password Password should be at most ${MAX_PASSWORD_LENGTH} characters long.`,
				),
			);

			// Verify method should not be called
			assert.strictEqual(mockProvider.verify.mock.callCount(), 0);
		});
	});
});
