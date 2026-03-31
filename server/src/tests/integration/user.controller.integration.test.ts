import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { UserController } from "../../controllers/index.js";
import User from "../../models/user.model.js";
import {
	generateMockInsertUsers,
	generateMockObjectId,
	generateMockSelectUser,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";
import { createMockExpressContext } from "../utils/index.js";

suite("User Controller 〖 Integration Tests 〗", () => {
	const controller = new UserController();

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => await User.deleteMany({}));

	describe("getAll", () => {
		test("Should return success response when 'service.getAll' is called successfully", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUsers = generateMockInsertUsers({ count: 3 });
			await User.insertMany(mockUsers);

			req.query = { pageNumber: "1" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(Array.isArray(response.data));
			assert.equal(response.data.length, 3);
		});

		test("Should return empty array when no users exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			req.query = { pageNumber: "1" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(Array.isArray(response.data));
			assert.equal(response.data.length, 0);
		});

		test("Should return '200' status code when 'service.getAll' is called", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUsers = generateMockInsertUsers({ count: 3 });
			await User.insertMany(mockUsers);

			req.query = { pageNumber: "1" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			assert.equal(res._getStatusCode(), 200);
		});

		test("Should exclude password field from all users in response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUsers = generateMockInsertUsers({ count: 3 });
			await User.insertMany(mockUsers);

			req.query = { pageNumber: "1" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.data);
			response.data.forEach((user: any) => {
				assert.ok(
					!user.password,
					"Password should not be included in response",
				);
			});
		});

		test("Should include isAdmin field for all users in response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUsers = generateMockInsertUsers({ count: 3 });
			await User.insertMany(mockUsers);

			req.query = { pageNumber: "1" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.data);
			response.data.forEach((user: any) => {
				assert.ok(
					"isAdmin" in user,
					"isAdmin field should be included in response",
				);
				assert.equal(typeof user.isAdmin, "boolean");
			});
		});
	});

	describe("getById", () => {
		test("Should return success response when 'service.getById' is called with valid 'userId' from params", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id.toString();

			await User.insertMany([mockUser]);
			req.params = { userId };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.equal(response.data._id.toString(), userId);
		});

		test("Should return success response when 'service.getById' is called with valid 'userId' from locals", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			res.locals = {
				review: {
					_id: generateMockObjectId(),
					comment: "Test comment",
					createdAt: new Date(),
					name: mockUser.name,
					product: generateMockObjectId(),
					rating: 5,
					updatedAt: new Date(),
					user: mockUser._id,
				},
				token: {
					_id: mockUser._id,
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
				},
				user: mockUser,
			};

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.equal(response.data._id.toString(), mockUser._id.toString());
		});

		test("Should throw 'NotFoundError' when user does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const nonExistentId = generateMockObjectId().toString();
			req.params = { userId: nonExistentId };

			// Act & Assert
			await assert.rejects(
				async () => {
					await controller.getById(req, res, next);
				},
				{
					message: "User not found",
					name: "NotFoundError",
				},
			);
		});

		test("Should return '200' status code when user is found", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			assert.equal(res._getStatusCode(), 200);
		});

		test("Should exclude password field from response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(
				!response.data.password,
				"Password should not be included in response",
			);
		});

		test("Should include isAdmin field in response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser({ isAdmin: true });
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(
				"isAdmin" in response.data,
				"isAdmin field should be included in response",
			);
			assert.equal(response.data.isAdmin, true);
		});
	});

	describe("update", () => {
		test("Should return success response when 'service.update' is called with valid user id from params", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };
			req.body = { name: "Updated Name" };

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.equal(response.data.name, "Updated Name");
		});

		test("Should return success response when 'service.update' is called with valid user id from locals", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			res.locals = {
				review: {
					_id: generateMockObjectId(),
					comment: "Test comment",
					createdAt: new Date(),
					name: mockUser.name,
					product: generateMockObjectId(),
					rating: 5,
					updatedAt: new Date(),
					user: mockUser._id,
				},
				token: {
					_id: mockUser._id,
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
				},
				user: mockUser,
			};
			req.body = { name: "Updated Name" };

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.equal(response.data.name, "Updated Name");
		});

		test("Should throw 'NotFoundError' when user does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const nonExistentId = generateMockObjectId().toString();
			req.params = { userId: nonExistentId };
			req.body = { name: "Updated Name" };

			// Act & Assert
			await assert.rejects(
				async () => {
					await controller.update(req, res, next);
				},
				{
					message: "User not found",
					name: "NotFoundError",
				},
			);
		});

		test("Should return '200' status code when update is successful", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };
			req.body = { name: "Updated Name" };

			// Act
			await controller.update(req, res, next);

			// Assert
			assert.equal(res._getStatusCode(), 200);
		});

		test("Should update only provided fields", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			const originalEmail = mockUser.email;
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };
			req.body = { name: "Updated Name" };

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.equal(response.data.name, "Updated Name");
			assert.equal(response.data.email, originalEmail.toLowerCase());
		});

		test("Should exclude password field from response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };
			req.body = { name: "Updated Name" };

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(
				!response.data.password,
				"Password should not be included in response",
			);
		});

		test("Should maintain existing fields when called with partial update", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			const originalData = { ...mockUser };
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };
			req.body = { name: "Updated Name" };

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.equal(response.data.name, "Updated Name");
			assert.equal(response.data.email, originalData.email.toLowerCase());
			assert.equal(response.data.isAdmin, originalData.isAdmin);
		});
	});

	describe("delete", () => {
		test("Should return success response when 'service.delete' is called with valid 'userId'", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };

			// Act
			await controller.delete(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.equal(response.data, null);
		});

		test("Should return '204' status code when 'service.delete' is called with valid 'userId'", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };

			// Act
			await controller.delete(req, res, next);

			// Assert
			assert.equal(res._getStatusCode(), 204);
		});

		test("Should throw 'NotFoundError' when user does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const nonExistentId = generateMockObjectId();
			req.params = { userId: nonExistentId.toString() };

			// Act & Assert
			await assert.rejects(
				async () => {
					await controller.delete(req, res, next);
				},
				{
					message: "User not found",
					name: "NotFoundError",
				},
			);
		});

		test("Should remove user from database when delete is successful", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockUser = generateMockSelectUser();
			await User.insertMany([mockUser]);
			req.params = { userId: mockUser._id.toString() };

			// Act
			await controller.delete(req, res, next);

			// Assert
			const deletedUser = await User.findById(mockUser._id);
			assert.equal(deletedUser, null, "User should be removed from database");
		});
	});
});
