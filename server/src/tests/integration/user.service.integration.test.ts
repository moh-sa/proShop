import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { NotFoundError, ValidationError } from "../../errors/index.js";
import User from "../../models/user.model.js";
import { UserService } from "../../services/user.service.js";
import {
	generateMockObjectId,
	generateMockSelectUser,
	generateMockSelectUsers,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("User Service 〖 Integration Tests 〗", () => {
	let userService: UserService;
	const mockUser = generateMockSelectUser();
	const mockUsers = generateMockSelectUsers({ count: 3 });

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(async () => {
		await User.deleteMany({});
		userService = new UserService();
	});

	describe("getById", () => {
		test("Should return user when 'repo.getById' is called with a valid ID", async () => {
			// Arrange
			await User.create(mockUser);

			// Act
			const result = await userService.getById({
				userId: mockUser._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email.toLowerCase());
			assert.strictEqual(result.data.isAdmin, mockUser.isAdmin);
		});

		test("Should return 'NotFoundError' when 'repo.getById' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

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
			await User.create(mockUser);

			// Act
			const result = await userService.getByEmail({ email: mockUser.email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email.toLowerCase());
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
		test("Should return array of users when 'repo.getAll' is called", async () => {
			// Arrange
			await User.insertMany(mockUsers);

			// Act
			const result = await userService.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert(Array.isArray(result.data));
			assert(result.data.length > 0);
			const foundUser = result.data.find(
				(user) => user.email === mockUsers[0].email.toLowerCase(),
			);
			assert(foundUser);
			assert.strictEqual(foundUser.name, mockUsers[0].name);
			assert.strictEqual(foundUser.email, mockUsers[0].email.toLowerCase());
		});
	});

	describe("updateById", () => {
		test("Should update user when 'repo.updateById' is called with valid data", async () => {
			// Arrange
			await User.create(mockUser);
			const updateData = {
				email: "updated@example.com",
				name: "Updated Name",
			};

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: mockUser._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, updateData.name);
			assert.strictEqual(result.data.email, updateData.email);
			assert.strictEqual(result.data.isAdmin, mockUser.isAdmin);
		});

		test("Should update admin status when 'repo.updateById' is called with isAdmin field", async () => {
			// Arrange
			await User.create(mockUser);
			const updateData = { isAdmin: true };

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: mockUser._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.isAdmin, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email.toLowerCase());
		});

		test("Should not update fields when 'repo.updateById' is called with empty object", async () => {
			// Arrange
			await User.create(mockUser);
			const updateData = {};

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: mockUser._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email.toLowerCase());
			assert.strictEqual(result.data.isAdmin, mockUser.isAdmin);
		});

		test("Should not update fields when 'repo.updateById' is called with undefined values", async () => {
			// Arrange
			await User.create(mockUser);
			const updateData = { email: "new@example.com", name: undefined };

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId: mockUser._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name); // Name should not be changed
			assert.strictEqual(result.data.email, "new@example.com"); // Email should update
		});

		test("Should return 'NotFoundError' when 'repo.updateById' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();
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
			const updateData = { email: "invalid-email" };
			const userId = generateMockObjectId().toString();

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return 'ValidationError' when 'repo.updateById' is called with a short password", async () => {
			// Arrange
			const updateData = { password: "123" };
			const userId = generateMockObjectId().toString();

			// Act
			const result = await userService.updateById({
				data: updateData,
				userId,
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
			await User.create(mockUser);

			// Act
			const result = await userService.delete({
				userId: mockUser._id.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, mockUser.name);
			assert.strictEqual(result.data.email, mockUser.email.toLowerCase());

			// Verify user is actually deleted
			const getResult = await userService.getById({
				userId: mockUser._id.toString(),
			});
			assert.strictEqual(getResult.success, false);
			assert.ok(getResult.error instanceof NotFoundError);
		});

		test("Should return 'NotFoundError' when 'repo.delete' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

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
