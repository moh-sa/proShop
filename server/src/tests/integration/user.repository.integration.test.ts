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
import { UserModel } from "../../models/user.model.js";
import { UserRepository } from "../../repositories/index.js";
import {
	generateMockInsertUser,
	generateMockInsertUsers,
	generateMockObjectId,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createUser,
	createUsers,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("UserRepository 〖 Integration Tests 〗", async () => {
	const repo = new UserRepository();

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(async () => await UserModel.deleteMany({}));

	describe("create", () => {
		test("Should return 'success result' with 'new user' when user is created successfully", async () => {
			// Arrange
			const mockUser = generateMockInsertUser();

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.id);
			assert.equal(result.data.name, mockUser.name);
			assert.equal(result.data.email, mockUser.email);
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
		test("Should return paginated items and meta for given page", async () => {
			// Arrange
			const createdUsers = await createUsers(
				generateMockInsertUsers({ count: 4 }).map((u, i) => ({
					...u,
					createdAt: new Date(2026, 0, i + 1),
				})),
			);

			const expectedResult = createdUsers
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(2, 4);

			// Act
			const result = await repo.getAll({
				pageNumber: 2,
				pageSize: 2,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, expectedResult.length);
			assert.strictEqual(result.data.items[0].email, expectedResult[0].email);
			assert.strictEqual(result.data.items[1].email, expectedResult[1].email);
			assert.strictEqual(result.data.meta.currentPage, 2);
			assert.strictEqual(result.data.meta.totalItems, createdUsers.length);
		});

		test("Should return empty items array and meta when no users exist", async () => {
			// Act
			const result = await repo.getAll({ pageNumber: 1, pageSize: 5 });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
			assert.strictEqual(result.data.meta.totalItems, 0);
		});

		test("Should apply filters before pagination", async () => {
			// Arrange
			const adminUsers = generateMockInsertUsers({
				count: 3,
				options: { isAdmin: true },
			});

			await createUsers([
				...adminUsers,
				...generateMockInsertUsers({
					count: 2,
					options: { isAdmin: false },
				}),
			]);

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { isAdmin: true },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, adminUsers.length);
			assert.ok(result.data.items.every((u) => u.isAdmin === true));
		});

		test("Should order items by sort when sort is provided", async () => {
			// Arrange
			const createdUsers = await createUsers(
				generateMockInsertUsers({ count: 10 }).map((u, i) => ({
					...u,
					createdAt: new Date(2026, 0, i + 1),
				})),
			);

			const expectedResult = createdUsers.sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
			);

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
				sort: { createdAt: "desc" },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 10);

			result.data.items.map((item, index) => {
				assert.strictEqual(item.id, expectedResult[index].id);
			});
		});

		test("Should filter by exact email", async () => {
			// Arrange
			const createdUsers = await createUsers(
				generateMockInsertUsers({ count: 5 }),
			);
			const targetEmail = createdUsers[0].email;

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { email: targetEmail },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 1);
			assert.strictEqual(result.data.items[0].email, targetEmail);
		});

		test("Should filter by name using case-insensitive partial match", async () => {
			// Arrange
			const createdUsers = await createUsers(
				generateMockInsertUsers({ count: 5 }),
			);
			const targetName = createdUsers[0].name;

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { name: targetName.toUpperCase() },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 1);
			assert.strictEqual(result.data.items[0].name, targetName);
		});

		test("Should return only selected fields when select is provided", async () => {
			// Arrange
			await createUser(generateMockInsertUser());

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
				select: { id: true, email: true },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 1);

			const item = result.data.items[0];
			assert.ok("id" in item);
			assert.ok("email" in item);
			assert.strictEqual(item.password, undefined);
			assert.strictEqual(item.name, undefined);
		});
	});

	describe("getById", () => {
		test("Should return 'success result' with 'user object' when user is found by ID", async () => {
			// Arrange
			const createdUser = await createUser(generateMockInsertUser());

			// Act
			const result = await repo.getById({ userId: createdUser.id });

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.name, createdUser.name);
			assert.equal(result.data.email, createdUser.email);
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
			await createUser(mockUser);

			// Act
			const result = await repo.getByEmail({
				email: mockUser.email,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.name, mockUser.name);
			assert.equal(result.data.email, mockUser.email);
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
			const createdUser = await createUser(
				generateMockInsertUser({
					email: "test+label@example.com",
				}),
			);
			const targetEmail = createdUser.email;

			// Act
			const result = await repo.getByEmail({
				email: targetEmail,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.email, targetEmail);
		});
	});

	describe("update", () => {
		test("Should return 'success result' with 'updated user' when user data is updated", async () => {
			// Arrange
			const createdUser = await createUser(generateMockInsertUser());

			const updateData = {
				email: "updated@example.com",
				name: "Updated Name",
			};

			// Act
			const result = await repo.update({
				data: updateData,
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.name, updateData.name);
			assert.equal(result.data.email, updateData.email);
		});

		test("Should return 'success result' with 'partially updated user' when only some fields are updated", async () => {
			// Arrange
			const createdUser = await createUser(generateMockInsertUser());
			const updateData = { name: "Updated Name" };

			// Act
			const result = await repo.update({
				data: updateData,
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.equal(result.data.name, updateData.name);

			assert.equal(result.data.email, createdUser.email); // Email should remain unchanged
		});

		test("Should return 'success result' with 'updated timestamps' when user is updated", async (t) => {
			// Arrange
			t.mock.timers.enable({ apis: ["Date"], now: new Date() });

			const createdUser = await createUser(generateMockInsertUser());
			const originalUpdatedAt = createdUser.updatedAt;

			t.mock.timers.tick(100);

			// Act
			const result = await repo.update({
				data: { name: "Updated Name" },
				userId: createdUser.id,
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
			const [user1, user2] = await createUsers(
				generateMockInsertUsers({ count: 2 }),
			);

			// Act
			const result = await repo.update({
				data: { email: user1.email },
				userId: user2.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});
	});

	describe("delete", () => {
		test("Should return 'success result' with 'deleted user' when user is deleted successfully", async () => {
			// Arrange
			const createdUser = await createUser(generateMockInsertUser());
			const userId = createdUser.id;

			// Act
			const result = await repo.delete({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.strictEqual(result.data.email, createdUser.email);

			// Verify user is actually deleted
			const foundUser = await repo.getById({ userId });
			assert.strictEqual(foundUser.success, true);
			assert.strictEqual(foundUser.data, null);
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
			const createdUser = await createUser(generateMockInsertUser());

			// Act
			const result = await repo.existsByEmail({
				email: createdUser.email,
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
			const createdUser = await createUser(
				generateMockInsertUser({
					email: "test+label@example.com",
				}),
			);
			const targetEmail = createdUser.email;

			// Act
			const result = await repo.existsByEmail({
				email: targetEmail,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
		});
	});
});
