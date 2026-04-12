import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { NotFoundError, ValidationError } from "../../errors/index.js";
import { UserModel } from "../../models/user.model.js";
import { userRepository } from "../../repositories/user.repository.js";
import { UserService } from "../../services/user.service.js";
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

suite("User Service 〖 Integration Tests 〗", () => {
	const userService = new UserService();
	const mockUser = generateMockInsertUser();
	const mockUsers = generateMockInsertUsers({ count: 3 });

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(async () => {
		await UserModel.deleteMany({});
	});

	describe("getById", () => {
		test("Should return user when 'repo.getById' is called with a valid ID", async () => {
			// Arrange
			const createdUser = await createUser(mockUser);

			// Act
			const result = await userService.getById({
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email);
			assert.strictEqual(result.data.isAdmin, mockUser.isAdmin);
		});

		test("Should return 'NotFoundError' when 'repo.getById' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await userService.getById({ userId: nonExistentId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.getById' is called with invalid 'userId'", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act
			const result = await userService.getById({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getByEmail", () => {
		test("Should return user when 'repo.getByEmail' is called with a valid email", async () => {
			// Arrange
			await createUser(mockUser);

			// Act
			const result = await userService.getByEmail({ email: mockUser.email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email);
			assert.strictEqual(result.data.isAdmin, mockUser.isAdmin);
		});

		test("Should return 'NotFoundError' when 'repo.getByEmail' is called with a non-existent email", async () => {
			// Arrange
			const nonExistentEmail = "nonexistent@example.com";

			// Act
			const result = await userService.getByEmail({ email: nonExistentEmail });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});
	});

	describe("getAll", () => {
		test("Should return paginated sanitized items and meta", async () => {
			// Arrange
			await createUsers(mockUsers);

			// Act
			const result = await userService.getAll({
				pageNumber: "1",
				pageSize: "2",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 2);

			assert.ok(!("password" in result.data.items[0]));
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.totalItems, mockUsers.length);
		});

		test("Should return empty items and correct meta when no users exist", async () => {
			// Act
			const result = await userService.getAll({
				pageNumber: "1",
				pageSize: "5",
			});

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
			const result = await userService.getAll({
				filters: { isAdmin: "true" },
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, adminUsers.length);
			result.data.items.forEach((item) => {
				assert.strictEqual(item.isAdmin, true);
			});
		});
	});

	describe("updateById", () => {
		test("Should update user when 'repo.updateById' is called with valid data", async () => {
			// Arrange
			const createdUser = await createUser(mockUser);

			const updateData = {
				email: "updated@example.com",
				name: "Updated Name",
			};

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, updateData.name);
			assert.strictEqual(result.data.email, updateData.email);
			assert.strictEqual(result.data.isAdmin, mockUser.isAdmin);
		});

		test("Should update admin status when 'repo.updateById' is called with isAdmin field", async () => {
			// Arrange
			const createdUser = await createUser(mockUser);

			const updateData = { isAdmin: true };

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isAdmin, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email);
		});

		test("Should not update fields when 'repo.updateById' is called with empty object", async () => {
			// Arrange
			const createdUser = await createUser(mockUser);

			const updateData = {};

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email);
			assert.strictEqual(result.data.isAdmin, mockUser.isAdmin);
		});

		test("Should not update fields when 'repo.updateById' is called with undefined values", async () => {
			// Arrange
			const createdUser = await createUser(mockUser);

			const updateData = { email: "new@example.com", name: undefined };

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name); // Name should not be changed
			assert.strictEqual(result.data.email, updateData.email); // Email should update
		});

		test("Should return 'NotFoundError' when 'repo.updateById' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();
			const updateData = { name: "Updated Name" };

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: nonExistentId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.updateById' is called with invalid update data", async () => {
			// Arrange
			const createdUser = await createUser(mockUser);

			const updateData = { email: "invalid-email" };

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'repo.updateById' is called with a short password", async () => {
			// Arrange
			const createdUser = await createUser(mockUser);

			const updateData = { password: "123" };

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: createdUser.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'repo.updateById' is called with invalid 'userId'", async () => {
			// Arrange
			const updateData = { name: "Updated Name" };
			const userId = "invalid-user-id";

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("delete", () => {
		test("Should delete user when 'repo.delete' is called with a valid ID", async () => {
			// Arrange
			const createdUser = await createUser(mockUser);

			const userId = createdUser.id;

			// Act
			const result = await userService.delete({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email);

			// Verify user is actually deleted
			const getResult = await userRepository.getById({ userId });
			assert.strictEqual(getResult.success, true);
			assert.strictEqual(getResult.data, null);
		});

		test("Should return 'NotFoundError' when 'repo.delete' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await userService.delete({ userId: nonExistentId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when 'repo.delete' is called with invalid 'userId'", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act
			const result = await userService.delete({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});
});
