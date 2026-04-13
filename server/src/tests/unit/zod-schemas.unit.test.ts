import assert from "node:assert";
import { describe, suite, test } from "node:test";

import { faker } from "@faker-js/faker";
import { Types } from "mongoose";
import { ZodError } from "zod";

import {
	emailValidator,
	jwtTokenValidator,
	objectIdValidator,
	passwordValidator,
} from "../../validators/index.js";
import { generateMockObjectId } from "../mocks/index.js";

suite("Zod Schemas 〖 Unit Tests 〗", () => {
	describe("emailValidator", () => {
		test("Should return 'user@example.com'", () => {
			// Arrange
			const email = "user@example.com";

			// Act
			const result = emailValidator.parse(email);

			// Assert
			assert.ok(result);
			assert.equal(result, email);
		});

		test("Should return trimmed email when '  user@example.com  ' is given", () => {
			// Arrange
			const email = "  user@example.com  ";

			// Act
			const result = emailValidator.parse(email);

			// Assert
			assert.ok(result);
			assert.equal(result, email.trim());
		});

		test("Should return lowercase email when 'USER@EXAMPLE.COM' is given", () => {
			// Arrange
			const email = "USER@EXAMPLE.COM";

			// Act
			const result = emailValidator.parse(email);

			// Assert
			assert.ok(result);
			assert.equal(result, email.toLowerCase());
		});

		test("Should return 'user@example.co'", () => {
			// Arrange
			const email = "user@example.co";

			// Act
			const result = emailValidator.parse(email);

			// Assert
			assert.ok(result);
			assert.equal(result, email);
		});

		test("Should return 'user.label@example.com'", () => {
			// Arrange
			const email = "user.label@example.com";

			// Act
			const result = emailValidator.parse(email);

			// Assert
			assert.ok(result);
			assert.equal(result, email);
		});

		test("Should return 'user+label@example.com'", () => {
			// Arrange
			const email = "user+label@example.com";

			// Act
			const result = emailValidator.parse(email);

			// Assert
			assert.ok(result);
			assert.equal(result, email);
		});

		test("Should throw 'ZodError' when 'empty string' is given", () => {
			// Arrange
			const email = "";

			// Act & Assert
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

		test("Should throw 'ZodError' when '   ' is given", () => {
			// Arrange
			const email = "   ";

			// Act & Assert
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

		test("Should throw 'ZodError' when 'user@' is given", () => {
			// Arrange
			const email = "user@";

			// Act & Assert
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
			// Arrange
			const email = "@example.com";

			// Act & Assert
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
			// Arrange
			const email = "userexample.com";

			// Act & Assert
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
			// Arrange
			const email = "not-an-email";

			// Act & Assert
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
			// Arrange
			const email = "u$er@e𝕏ample";

			// Act & Assert
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
			// Arrange
			const token = faker.internet.jwt();

			// Act
			const result = jwtTokenValidator.parse(token);

			// Assert
			assert.ok(result);
			assert.equal(result, token);
		});

		test("Should return jwt token without whitespace", () => {
			// Arrange
			const token = `   ${faker.internet.jwt()}   `;

			// Act
			const result = jwtTokenValidator.parse(token);

			// Assert
			assert.ok(result);
			assert.equal(result, token.trim());
		});

		test("Should throw 'ZodError' when 'empty string' is given", () => {
			// Arrange
			const token = "";

			// Act & Assert
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

		test("Should throw 'ZodError' when 'whitespace-only' is given", () => {
			// Arrange
			const token = "   ";

			// Act & Assert
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

		test("Should throw 'ZodError' when 'invalid jwt token' is given", () => {
			// Arrange
			const jwt = faker.internet.jwt();
			const token = `${jwt.slice(0, 10)}#$%${jwt.slice(10)}`;

			// Act & Assert
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
			// Arrange
			const token = "not-a-jwt-token";

			// Act & Assert
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
			// Arrange
			const id = new Types.ObjectId();

			// Act
			const result = objectIdValidator.parse(id);

			// Assert
			assert.ok(result);
			assert.equal(result, id);
		});

		test("Should return 'Types.ObjectId' when a ObjectId string is given", () => {
			// Arrange
			const id = generateMockObjectId();

			// Act
			const result = objectIdValidator.parse(id);

			// Assert
			assert.ok(result);
			assert.equal(result.toString(), id);
		});

		test("Should return 'Types.ObjectId' when a ObjectId string with whitespace is given", () => {
			// Arrange
			const id = `   ${generateMockObjectId()}   `;

			// Act
			const result = objectIdValidator.parse(id);

			// Assert
			assert.ok(result);
			assert.equal(result.toString(), id.trim());
		});

		test("Should throw 'ZodError' when 'empty string' is given", () => {
			// Arrange
			const id = "";

			// Act & Assert
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
			// Arrange
			const id = "   ";

			// Act & Assert
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
			// Arrange
			const ogId = generateMockObjectId();
			const id = `${ogId.slice(0, 10)}#$%${ogId.slice(10)}`;

			// Act & Assert
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
			// Arrange
			const id = "not-a-ObjectId";

			// Act & Assert
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
			// Arrange
			const id = 123;

			// Act & Assert
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

	describe("passwordValidator", () => {
		test("Should return 'password' when 'password' is given", () => {
			// Arrange
			const password = "password";

			// Act
			const result = passwordValidator.parse(password);

			// Assert
			assert.ok(result);
			assert.equal(result, password);
		});

		test("Should return 'password' when' password 'is given", () => {
			// Arrange
			const password = " password ";

			// Act
			const result = passwordValidator.parse(password);

			// Assert
			assert.ok(result);
			assert.equal(result, password.trim());
		});

		test("Should return 'pass word' when 'pass word' is given", () => {
			// Arrange
			const password = "pass word";

			// Act
			const result = passwordValidator.parse(password);

			// Assert
			assert.ok(result);
			assert.equal(result, password);
		});

		test("Should return 'passWord' when 'passWord' is given", () => {
			// Arrange
			const password = "passWord";

			// Act
			const result = passwordValidator.parse(password);

			// Assert
			assert.ok(result);
			assert.equal(result, password);
		});

		test("Should throw 'ZodError' when 'empty string' is given", () => {
			// Arrange
			const password = "";

			// Act & Assert
			assert.throws(
				() => passwordValidator.parse(password),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.equal(error.issues.length, 1);
					assert.equal(
						error.issues[0].message,
						"Password should be at least 6 characters long.",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' when 'whitespace-only' is given", () => {
			// Arrange
			const password = "   ";

			// Act & Assert
			assert.throws(
				() => passwordValidator.parse(password),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.equal(error.issues.length, 1);
					assert.equal(
						error.issues[0].message,
						"Password should be at least 6 characters long.",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' when '123' is given", () => {
			// Arrange
			const password = "123";

			// Act & Assert
			assert.throws(
				() => passwordValidator.parse(password),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.equal(error.issues.length, 1);
					assert.equal(
						error.issues[0].message,
						"Password should be at least 6 characters long.",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' when a password more than 128 chars is given", () => {
			// Arrange
			const password = faker.lorem.words(25);

			// Act & Assert
			assert.throws(
				() => passwordValidator.parse(password),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.equal(error.issues.length, 1);
					assert.equal(
						error.issues[0].message,
						"Password should be at most 128 characters long.",
					);
					return true;
				},
			);
		});
	});
});
