import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { AuthenticationError } from "../../errors/index.js";
import User from "../../models/user.model.js";
import { AuthService } from "../../services/index.js";
import { generateMockUser } from "../mocks/index.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("Auth Service 〖 Integration Tests 〗", () => {
	let authService: AuthService;
	const mockUser = generateMockUser();

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(async () => {
		await User.deleteMany({});
		authService = new AuthService();
	});

	describe("signup", () => {
		test("Should create a new user when 'signup' is called with valid data", async () => {
			// Act
			const result = await authService.signup(mockUser);

			// Assert
			assert.strictEqual(result.name, mockUser.name);
			assert.strictEqual(result.email, mockUser.email);
			assert.strictEqual(result.isAdmin, mockUser.isAdmin);
			assert.ok(result.token, "Should return a JWT token");
			assert.ok(!("password" in result), "Should not return password");
		});

		test("Should throw 'AuthenticationError' when 'signup' is called with existing email", async () => {
			// Arrange
			await User.create(mockUser);

			// Act & Assert
			await assert.rejects(
				async () => await authService.signup(mockUser),
				AuthenticationError,
			);
		});

		test("Should handle signup with minimum required fields", async () => {
			// Arrange
			const minimalUser = {
				email: "minimal@example.com",
				isAdmin: false,
				name: "Minimal",
				password: "pass123",
			};

			// Act
			const result = await authService.signup(minimalUser);

			// Assert
			assert.strictEqual(result.name, minimalUser.name);
			assert.strictEqual(result.email, minimalUser.email);
			assert.ok(result.token);
		});
	});

	describe("signin", () => {
		test("Should authenticate user when 'signin' is called with valid credentials", async () => {
			// Arrange
			await User.create(mockUser);

			const credentials = {
				email: mockUser.email,
				password: mockUser.password,
			};

			// Act
			const result = await authService.signin(credentials);

			// Assert
			assert.strictEqual(result.email, credentials.email);
			assert.ok(result.token, "Should return a JWT token");
			assert.ok(!("password" in result), "Should not return password");
		});

		test("Should throw 'AuthenticationError' when 'signin' is called with invalid password", async () => {
			// Arrange
			await User.create(mockUser);

			const invalidCredentials = {
				email: mockUser.email,
				password: "wrong-123-password",
			};

			// Act & Assert
			await assert.rejects(
				async () => await authService.signin(invalidCredentials),
				(err: Error) => {
					assert.ok(err instanceof AuthenticationError);
					assert.strictEqual(err.message, "Invalid email or password.");
					return true;
				},
			);
		});

		test("Should throw 'AuthenticationError' when 'signin' is called with non-existent email", async () => {
			// Arrange
			const nonExistentUser = {
				email: "nonexistent@example.com",
				password: "some-password",
			};

			// Act & Assert
			await assert.rejects(
				async () => await authService.signin(nonExistentUser),
				(err: Error) => {
					assert.ok(err instanceof AuthenticationError);
					assert.strictEqual(err.message, "Invalid email or password.");
					return true;
				},
			);
		});
	});
});
