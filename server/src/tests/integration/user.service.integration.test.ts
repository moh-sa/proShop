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
			assert.strictEqual(result.name, mockUser.name);
			assert.strictEqual(result.email, mockUser.email.toLowerCase());
			assert.strictEqual(result.isAdmin, mockUser.isAdmin);
		});

		test("Should throw 'NotFoundError' when 'repo.getById' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(async () => {
				await userService.getById({ userId: nonExistentId });
			}, NotFoundError);
		});

		test("Should throw 'ValidationError' when 'repo.getById' is called with invalid 'userId''", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act & Assert
			await assert.rejects(async () => {
				await userService.getById({ userId });
			}, ValidationError);
		});
	});

	describe("getByEmail", () => {
		test("Should return user when 'repo.getByEmail' is called with a valid email", async () => {
			// Arrange
			await User.create(mockUser);

			// Act
			const result = await userService.getByEmail({ email: mockUser.email });

			// Assert
			assert.strictEqual(result.name, mockUser.name);
			assert.strictEqual(result.email, mockUser.email.toLowerCase());
			assert.strictEqual(result.isAdmin, mockUser.isAdmin);
		});

		test("Should throw 'NotFoundError' when 'repo.getByEmail' is called with a non-existent email", async () => {
			// Arrange
			const nonExistentEmail = "nonexistent@example.com";

			// Act & Assert
			await assert.rejects(async () => {
				await userService.getByEmail({ email: nonExistentEmail });
			}, NotFoundError);
		});
	});

	describe("getAll", () => {
		test("Should return array of users when 'repo.getAll' is called", async () => {
			// Arrange
			await User.insertMany(mockUsers);

			// Act
			const results = await userService.getAll();

			// Assert
			assert(Array.isArray(results));
			assert(results.length > 0);
			const foundUser = results.find(
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
			assert.strictEqual(result.name, updateData.name);
			assert.strictEqual(result.email, updateData.email);
			assert.strictEqual(result.isAdmin, mockUser.isAdmin);
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
			assert.strictEqual(result.isAdmin, true);
			assert.strictEqual(result.name, mockUser.name);
			assert.strictEqual(result.email, mockUser.email.toLowerCase());
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
			assert.strictEqual(result.name, mockUser.name);
			assert.strictEqual(result.email, mockUser.email.toLowerCase());
			assert.strictEqual(result.isAdmin, mockUser.isAdmin);
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
			assert.strictEqual(result.name, mockUser.name); // Name should not be changed
			assert.strictEqual(result.email, "new@example.com"); // Email should update
		});

		test("Should throw 'NotFoundError' when 'repo.updateById' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();
			const updateData = { name: "Updated Name" };

			// Act & Assert
			await assert.rejects(async () => {
				await userService.updateById({
					data: updateData,
					userId: nonExistentId,
				});
			}, NotFoundError);
		});

		test("Should throw 'ValidationError' when 'repo.updateById' is called with invalid update data", async () => {
			// Arrange
			const updateData = { email: "invalid-email" };
			const userId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(async () => {
				await userService.updateById({
					data: updateData,
					userId,
				});
			}, ValidationError);
		});

		test("Should throw 'ValidationError' when 'repo.updateById' is called with a short password", async () => {
			// Arrange
			const updateData = { password: "123" };
			const userId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(async () => {
				await userService.updateById({
					data: updateData,
					userId,
				});
			}, ValidationError);
		});

		test("Should throw 'ValidationError' when 'repo.updateById' is called with invalid 'userId'", async () => {
			// Arrange
			const updateData = { name: "Updated Name" };
			const userId = "invalid-user-id";

			// Act & Assert
			await assert.rejects(async () => {
				await userService.updateById({
					data: updateData,
					userId,
				});
			}, ValidationError);
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
			assert.strictEqual(result.name, mockUser.name);
			assert.strictEqual(result.email, mockUser.email.toLowerCase());

			// Verify user is actually deleted
			await assert.rejects(async () => {
				await userService.getById({ userId: mockUser._id.toString() });
			}, NotFoundError);
		});

		test("Should throw 'NotFoundError' when 'repo.delete' is called with a non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act & Assert
			await assert.rejects(async () => {
				await userService.delete({ userId: nonExistentId });
			}, NotFoundError);
		});

		test("Should throw 'ValidationError' when 'repo.delete' is called with invalid 'userId'", async () => {
			// Arrange
			const userId = "invalid-user-id";

			// Act & Assert
			await assert.rejects(async () => {
				await userService.delete({ userId });
			}, ValidationError);
		});
	});
});
