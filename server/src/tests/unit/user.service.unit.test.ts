import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import type { InsertUser } from "../../types/index.js";

import {
	InternalError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import { UserService } from "../../services/index.js";
import {
	generateMockInsertUser,
	generateMockSelectUser,
	generateMockSelectUsers,
	mockUserRepository,
} from "../mocks/index.js";

suite("User Service 〖 Unit Tests 〗", () => {
	const mockRepo = mockUserRepository();
	const service = new UserService(mockRepo);

	beforeEach(() => mockRepo.reset());

	describe("create", () => {
		const mockInsertUser = generateMockInsertUser();
		const mockSelectUser = generateMockSelectUser({ ...mockInsertUser });
		const { password: _, ...expectedUser } = mockSelectUser;

		test("Should return 'user object' when 'repo.create' is called once with 'user data'", async () => {
			// Arrange
			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockSelectUser,
					success: true,
				}),
			);

			// Act
			const result = await service.create(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUser);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockInsertUser,
			);
		});

		test("Should return 'ValidationError' when user data is invalid", async () => {
			// Arrange
			const invalidInsertUser = generateMockInsertUser({
				email: "invalid-email",
				name: "",
			});

			// Act
			const result = await service.create(invalidInsertUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAll", () => {
		const mockUsers = generateMockSelectUsers({ count: 5 });
		const expectedUsers = mockUsers.map((user) => {
			const { password: _, ...expectedUser } = user;
			return expectedUser;
		});

		test("Should return 'array of users' when 'repo.getAll' is called once with no args", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUsers,
					success: true,
				}),
			);

			// Act
			const result = await service.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUsers);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should return 'empty array' when 'repo.getAll' returns 'empty array'", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: [],
					success: true,
				}),
			);

			// Act
			const result = await service.getAll();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 0);
		});
	});

	describe("getById", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id;
		const { password: _, ...expectedUser } = mockUser;

		test("Should return 'user object' when 'repo.getById' is called once with 'userId'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);

			// Act
			const result = await service.getById({ userId: mockUser._id.toString() });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUser);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getById.mock.calls[0].arguments[0].userId,
				expectedUser._id,
			);
		});

		test("Should return 'NotFoundError' when 'repo.getById' returns 'null'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.getById({ userId: userId.toString() });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when userId is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-objectid" as any;

			// Act
			const result = await service.getById({ userId: invalidUserId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getByEmail", () => {
		const mockUser = generateMockSelectUser();
		const { password: _, ...expectedUser } = mockUser;
		const email = mockUser.email;

		test("Should return 'user object' when 'repo.getByEmail' is called once with 'email'", async () => {
			// Arrange
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);

			// Act
			const result = await service.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUser);

			assert.strictEqual(mockRepo.getByEmail.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getByEmail.mock.calls[0].arguments[0].email,
				email,
			);
		});

		test("Should return 'NotFoundError' when 'repo.getByEmail' returns 'null'", async () => {
			// Arrange
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when email is invalid", async () => {
			// Arrange
			const invalidEmail = "not-an-email";

			// Act
			const result = await service.getByEmail({ email: invalidEmail });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getByEmail.mock.callCount(), 0);
		});
	});

	describe("updateById", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id;

		const updateData: Partial<InsertUser> = { name: "new-name" };
		const updatedData = { ...mockUser, ...updateData };
		const { password: _, ...expectedUpdatedData } = updatedData;

		test("Should return 'user object' without 'password' when 'repo.update' is called once with 'userId' and 'updateData'", async () => {
			// Arrange
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: updatedData,
					success: true,
				}),
			);

			// Act
			const result = await service.updateById({
				data: updateData,
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUpdatedData);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.update.mock.calls[0].arguments[0].userId,
				userId,
			);
			assert.deepStrictEqual(
				mockRepo.update.mock.calls[0].arguments[0].data,
				updateData,
			);
		});

		test("Should return 'NotFoundError' when 'repo.update' returns 'null'", async () => {
			// Arrange
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.updateById({
				data: updateData,
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when userId is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-objectid" as any;

			// Act
			const result = await service.updateById({
				data: updateData,
				userId: invalidUserId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.update.mock.callCount(), 0);
		});

		test("Should return 'ValidationError' when update data is invalid", async () => {
			// Arrange
			const invalidUpdateData = generateMockInsertUser({
				email: "invalid-email",
				name: "",
			});

			// Act
			const result = await service.updateById({
				data: invalidUpdateData,
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.update.mock.callCount(), 0);
		});
	});

	describe("delete", () => {
		const mockUser = generateMockSelectUser();
		const { password: _, ...expectedUser } = mockUser;
		const userId = mockUser._id;

		test("Should return 'user object' when 'repo.delete' is called once with 'userId'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);

			// Act
			const result = await service.delete({ userId: userId.toString() });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUser);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.delete.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should return 'NotFoundError' when 'repo.delete' returns 'null'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.delete({ userId: userId.toString() });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when userId is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-objectid" as any;

			// Act
			const result = await service.delete({ userId: invalidUserId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 0);
		});
	});

	describe("existsByEmail", () => {
		test("Should return 'user id object' when user exists", async () => {
			// Arrange
			const { _id: userId, email } = generateMockSelectUser();
			const expectedResult = { _id: userId };

			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: expectedResult,
					success: true,
				}),
			);

			// Act
			const result = await service.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.existsByEmail.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.existsByEmail.mock.calls[0].arguments[0].email,
				email,
			);
		});

		test("Should return 'null' when user does not exist", async () => {
			// Arrange
			const { email } = generateMockSelectUser();

			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'ValidationError' when email is invalid", async () => {
			// Arrange
			const invalidEmail = "not-an-email";

			// Act
			const result = await service.existsByEmail({ email: invalidEmail });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.existsByEmail.mock.callCount(), 0);
		});
	});

	describe("sanitizeUser", () => {
		test("Should return user object without password", () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const { password: _, ...expectedUser } = mockUser;

			// Act
			const result = service.sanitizeUser(mockUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUser);
		});

		test("Should return 'InternalError' when user data is invalid", () => {
			// Arrange
			const invalidUser = { invalid: "data" } as any;

			// Act
			const result = service.sanitizeUser(invalidUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof InternalError);
		});
	});

	describe("create_UNSAFE", () => {
		test("Should return 'full user object' including password when 'repo.create' succeeds", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const mockSelectUser = generateMockSelectUser({ ...mockInsertUser });

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockSelectUser,
					success: true,
				}),
			);

			// Act
			const result = await service.create_UNSAFE(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockSelectUser);
			assert.ok(result.data.password); // Ensure password is included

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockInsertUser,
			);
		});

		test("Should return 'ValidationError' when user data is invalid", async () => {
			// Arrange
			const invalidInsertUser = generateMockInsertUser({
				email: "invalid-email",
				name: "",
			});

			// Act
			const result = await service.create_UNSAFE(invalidInsertUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getByEmail_UNSAFE", () => {
		test("Should return 'full user object' including password when user exists", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const email = mockUser.email;

			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);

			// Act
			const result = await service.getByEmail_UNSAFE({ email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockUser);
			assert.ok(result.data.password); // Ensure password is included

			assert.strictEqual(mockRepo.getByEmail.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getByEmail.mock.calls[0].arguments[0].email,
				email,
			);
		});

		test("Should return 'NotFoundError' when user does not exist", async () => {
			// Arrange
			const { email } = generateMockSelectUser();

			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.getByEmail_UNSAFE({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when email is invalid", async () => {
			// Arrange
			const invalidEmail = "not-an-email";

			// Act
			const result = await service.getByEmail_UNSAFE({ email: invalidEmail });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getById_UNSAFE", () => {
		test("Should return 'full user object' including password when user exists", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);

			// Act
			const result = await service.getById_UNSAFE({
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockUser);
			assert.ok(result.data.password); // Ensure password is included

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getById.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should return 'NotFoundError' when user does not exist", async () => {
			// Arrange
			const { _id: userId } = generateMockSelectUser();

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.getById_UNSAFE({
				userId: userId.toString(),
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when userId is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-objectid" as any;

			// Act
			const result = await service.getById_UNSAFE({ userId: invalidUserId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});
});
