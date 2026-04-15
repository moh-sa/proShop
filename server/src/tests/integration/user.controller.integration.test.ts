import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { UserController } from "../../controllers/index.js";
import { NotFoundError } from "../../errors/index.js";
import { UserModel } from "../../models/user.model.js";
import { userRepository } from "../../repositories/user.repository.js";
import type { SafeSelectUser } from "../../types/index.js";
import {
	generateMockInsertReview,
	generateMockInsertUser,
	generateMockInsertUsers,
	generateMockObjectId,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContextFromHandler,
	createUser,
	createUsers,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("User Controller 〖 Integration Tests 〗", () => {
	const controller = new UserController();

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => await UserModel.deleteMany({}));

	describe("getAll", () => {
		test("Should return success response when 'service.getAll' is called successfully", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			await createUsers(generateMockInsertUsers({ count: 3 }));

			req.query = { pageNumber: "1" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);
			req.query = { pageNumber: "1" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			await createUsers(generateMockInsertUsers({ count: 3 }));

			req.query = { pageNumber: "1" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			assert.equal(res._getStatusCode(), 200);
		});

		test("Should exclude password field from all users in response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			await createUsers(generateMockInsertUsers({ count: 3 }));

			req.query = { pageNumber: "1" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.data);
			response.data.forEach((user: SafeSelectUser) => {
				assert.ok(
					!("password" in user),
					"Password should not be included in response",
				);
			});
		});

		test("Should include isAdmin field for all users in response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			await createUsers(generateMockInsertUsers({ count: 3 }));

			req.query = { pageNumber: "1" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.data);
			response.data.forEach((user: SafeSelectUser) => {
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);

			const createdUser = await createUser(generateMockInsertUser());
			const userId = createdUser.id;

			req.params = { userId };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.equal(response.data.id, userId);
		});

		test("Should return success response when 'service.getById' is called with valid 'userId' from locals", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);

			const createdUser = await createUser(generateMockInsertUser());
			const userId = createdUser.id;

			res.locals = {
				review: generateMockInsertReview({ user: userId }),
				token: {
					id: userId,
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
				},
				user: createdUser,
			};

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.equal(response.data.id, userId);
		});

		test("Should throw 'NotFoundError' when user does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			const nonExistentId = generateMockObjectId();
			req.params = { userId: nonExistentId };

			// Act & Assert
			await assert.rejects(
				async () => {
					// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response & Assert
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.getById(req, res, next);

			// Assert
			assert.equal(res._getStatusCode(), 200);
		});

		test("Should exclude password field from response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);

			const createdUser = await createUser(
				generateMockInsertUser({ isAdmin: true }),
			);

			req.params = { userId: createdUser.id };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };
			req.body = { name: "Updated Name" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdUser = await createUser(generateMockInsertUser());
			const userId = createdUser.id;

			res.locals = {
				review: generateMockInsertReview({ user: userId }),
				token: {
					id: userId,
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
				},
				user: createdUser,
			};

			req.body = { name: "Updated Name" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);
			const nonExistentId = generateMockObjectId();
			req.params = { userId: nonExistentId };
			req.body = { name: "Updated Name" };

			// Act & Assert
			await assert.rejects(async () => {
				// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response & Assert
				await controller.update(req, res, next);
			}, NotFoundError);
		});

		test("Should return '200' status code when update is successful", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };
			req.body = { name: "Updated Name" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.update(req, res, next);

			// Assert
			assert.equal(res._getStatusCode(), 200);
		});

		test("Should update only provided fields", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };
			req.body = { name: "Updated Name" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.equal(response.data.name, "Updated Name");
			assert.equal(response.data.email, createdUser.email.toLowerCase());
		});

		test("Should exclude password field from response", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };
			req.body = { name: "Updated Name" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };
			req.body = { name: "Updated Name" };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.equal(response.data.name, "Updated Name");
			assert.equal(response.data.email, createdUser.email.toLowerCase());
			assert.equal(response.data.isAdmin, createdUser.isAdmin);
		});
	});

	describe("delete", () => {
		test("Should return success response when 'service.delete' is called with valid 'userId'", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.delete(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.equal(response.data, null);
		});

		test("Should return '204' status code when 'service.delete' is called with valid 'userId'", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.delete(req, res, next);

			// Assert
			assert.equal(res._getStatusCode(), 204);
		});

		test("Should throw 'NotFoundError' when user does not exist", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);
			const nonExistentId = generateMockObjectId();
			req.params = { userId: nonExistentId };

			// Act & Assert
			await assert.rejects(
				async () => {
					// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response & Assert
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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);

			const createdUser = await createUser(generateMockInsertUser());

			req.params = { userId: createdUser.id };

			// Act
			// @ts-expect-error - type mismatch between my asyncHandler and express Request/Response
			await controller.delete(req, res, next);

			// Assert
			const deletedUser = await userRepository.getById({
				userId: createdUser.id,
			});
			assert.ok(deletedUser.success);
			assert.equal(
				deletedUser.data,
				null,
				"User should be removed from database",
			);
		});
	});
});
