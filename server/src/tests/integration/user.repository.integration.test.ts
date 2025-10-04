import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import {
	MAX_PASSWORD_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "../../constants/password.constants.js";
import {
	DatabaseDuplicateKeyError,
	DatabaseValidationError,
} from "../../errors/index.js";
import User from "../../models/user.model.js";
import { UserRepository } from "../../repositories/index.js";
import {
	generateMockInsertUser,
	generateMockInsertUsers,
	generateMockObjectId,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("UserRepository 〖 Integration Tests 〗", async () => {
	const repo = new UserRepository();

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(async () => await User.deleteMany({}));

	describe("create", () => {
		test("Should return 'success result' with 'new user' when user is created successfully", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data._id);
			assert.equal(result.data.name, mockUser.name);
			assert.equal(result.data.email, mockUser.email.toLowerCase());
			assert.equal(result.data.isAdmin, mockUser.isAdmin);
			assert.ok(result.data.createdAt);
			assert.ok(result.data.updatedAt);
		});

		test("Should return 'success result' for both admin and non-admin users", async () => {
			// Arrange
			const adminUser = generateMockInsertUser({ isAdmin: true });
			const regularUser = generateMockInsertUser({ isAdmin: false });

			// Act
			const adminResult = await repo.create(adminUser);
			const regularResult = await repo.create(regularUser);

			// Assert
			assert.strictEqual(adminResult.success, true);
			assert.equal(adminResult.data.isAdmin, true);

			assert.strictEqual(regularResult.success, true);
			assert.equal(regularResult.data.isAdmin, false);
		});

		test("Should return 'success result' with Date objects for timestamps", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.createdAt instanceof Date);
			assert.ok(result.data.updatedAt instanceof Date);
		});

		test("Should return 'success result' when name contains Unicode characters", async () => {
			// Arrange
			const mockUser = generateMockInsertUser({ name: "Mohamméd 🎉" });

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.equal(result.data.name, mockUser.name);
		});

		test("Should return 'failure result' with 'DatabaseDuplicateKeyError' when creating user with existing email", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();
			await repo.create(mockUser);

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when when email is invalid", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser({
				email: "invalid-email",
			});

			// Act
			const result = await repo.create(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when name is empty", async () => {
			// Arrange
			const mockUser = generateMockInsertUser({ name: "" });

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when password is less than 6 characters", async () => {
			// Arrange
			const mockUser = generateMockInsertUser({
				password: "1".repeat(MIN_PASSWORD_LENGTH - 1),
			});

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when password is more than 128 characters", async () => {
			// Arrange
			const mockUser = generateMockInsertUser({
				password: "1".repeat(MAX_PASSWORD_LENGTH + 1),
			});

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("getAll", () => {
		test("Should return 'success result' with 'all users' when users exist", async () => {
			// Arrange
			const mockUsers = generateMockInsertUsers({ count: 3 });
			await User.insertMany(mockUsers);

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.equal(result.data.length, mockUsers.length);
		});

		test("Should return 'success result' with 'empty array' when no users exist", async () => {
			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.equal(result.data.length, 0);
		});
	});

	describe("getById", () => {
		test("Should return 'success result' with 'user object' when user is found by ID", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const user = await User.create(mockUser);

			// Act
			const result = await repo.getById({ userId: user._id });

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.name, mockUser.name);
			assert.equal(result.data.email, mockUser.email.toLowerCase());
		});

		test("Should return 'success result' with 'null' when user ID does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await repo.getById({ userId: nonExistentId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.equal(result.data, null);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when ObjectId is invalid", async () => {
			// Arrange
			const invalidId = "invalid-id" as any;

			// Act
			const result = await repo.getById({ userId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("getByEmail", () => {
		test("Should return 'success result' with 'user object' when user is found by email", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();
			await User.create(mockUser);

			// Act
			const result = await repo.getByEmail({
				email: mockUser.email,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.name, mockUser.name);
			assert.equal(result.data.email, mockUser.email.toLowerCase());
		});

		test("Should return 'success result' with 'null' when email does not exist", async () => {
			// Arrange
			const email = "nonexistent@example.com";

			// Act
			const result = await repo.getByEmail({
				email,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.equal(result.data, null);
		});

		test("Should return 'success result' when email contains special characters", async () => {
			// Arrange
			const mockUser = generateMockInsertUser({
				email: "test+label@example.com",
			});
			await User.create(mockUser);

			// Act
			const result = await repo.getByEmail({
				email: mockUser.email,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.email, mockUser.email);
		});
	});

	describe("update", () => {
		test("Should return 'success result' with 'updated user' when user data is updated", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const user = await User.create(mockUser);
			const updateData = {
				email: "updated@example.com",
				name: "Updated Name",
			};

			// Act
			const result = await repo.update({
				data: updateData,
				userId: user._id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.name, updateData.name);
			assert.equal(result.data.email, updateData.email);
		});

		test("Should return 'success result' with 'partially updated user' when only some fields are updated", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const user = await User.create(mockUser);
			const updateData = { name: "Updated Name" };

			// Act
			const result = await repo.update({
				data: updateData,
				userId: user._id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.name, updateData.name);
			assert.equal(result.data.email, mockUser.email.toLowerCase()); // Email should remain unchanged
		});

		test("Should return 'success result' with 'updated timestamps' when user is updated", async (t) => {
			// Arrange
			t.mock.timers.enable({ apis: ["Date"], now: new Date() });
			const mockUser = generateMockInsertUser();
			const user = await User.create(mockUser);
			const originalUpdatedAt = user.updatedAt;

			t.mock.timers.tick(100);

			// Act
			const result = await repo.update({
				data: { name: "Updated Name" },
				userId: user._id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.ok(result.data.updatedAt > originalUpdatedAt);
		});

		test("Should return 'success result' with 'null' when user ID does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();
			const updateData = { name: "Updated Name" };

			// Act
			const result = await repo.update({
				data: updateData,
				userId: nonExistentId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.equal(result.data, null);
		});

		test("Should return 'failure result' with 'DatabaseDuplicateKeyError' when updating with existing email", async () => {
			// Arrange
			const mockUsers = generateMockInsertUsers({ count: 2 });
			const result1 = await repo.create(mockUsers[0]);
			const result2 = await repo.create(mockUsers[1]);

			assert.strictEqual(result1.success, true);
			assert.strictEqual(result2.success, true);

			// Act
			const result = await repo.update({
				data: { email: result1.data.email },
				userId: result2.data._id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});
	});

	describe("delete", () => {
		test("Should return 'success result' with 'deleted user' when user is deleted successfully", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const user = await User.create(mockUser);

			// Act
			const result = await repo.delete({ userId: user._id });
			const foundUser = await User.findById(user._id);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.email, mockUser.email.toLowerCase());
			assert.equal(foundUser, null);
		});

		test("Should return 'success result' with 'null' when user ID does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await repo.delete({ userId: nonExistentId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.equal(result.data, null);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when ObjectId is invalid", async () => {
			// Arrange
			const invalidId = "invalid-id" as any;

			// Act
			const result = await repo.delete({ userId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("existsByEmail", () => {
		test("Should return 'success result' with 'userId' when user exists by email", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();
			await User.create(mockUser);

			// Act
			const result = await repo.existsByEmail({
				email: mockUser.email,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
		});

		test("Should return 'success result' with 'null' when user does not exist by email", async () => {
			// Act
			const result = await repo.existsByEmail({
				email: "nonexistent@example.com",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.equal(result.data, null);
		});

		test("Should return 'success result' when email contains special characters", async () => {
			// Arrange
			const mockUser = generateMockInsertUser({
				email: "test+label@example.com",
			});
			await User.create(mockUser);

			// Act
			const result = await repo.existsByEmail({
				email: mockUser.email,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
		});
	});
});
