import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import { DEMO_ACCOUNT_EMAILS } from "../../constants/index.js";
import {
	ForbiddenError,
	InternalError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import { UserService } from "../../services/index.js";
import type {
	GetAllUsersServiceParams,
	UpdateUserInput,
	User,
	UserSelect,
} from "../../types/index.js";
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
		test("Should return sanitized paginated items and meta; pass args to repo", async () => {
			// Arrange
			const items = generateMockSelectUsers({ count: 3 });
			const meta = {
				currentPage: 2,
				hasNextPage: true,
				hasPreviousPage: true,
				pageSize: 3,
				totalItems: 9,
				totalPages: 3,
			};

			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items, meta },
					success: true,
				}),
			);

			const userServiceGetAllSelect: UserSelect = {
				id: true,
				createdAt: true,
				email: true,
				isAdmin: true,
				name: true,
				updatedAt: true,
			};

			const args: GetAllUsersServiceParams = {
				pageNumber: "2",
				pageSize: "3",
				filters: { isAdmin: "true" },
				sort: "createdAt:asc",
			};

			// Act
			const result = await service.getAll(args);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, items.length);
			// Ensure items are sanitized (no password)
			assert.ok(!("password" in result.data.items[0]));
			assert.deepStrictEqual(result.data.meta, meta);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);

			const callArgs = mockRepo.getAll.mock.calls[0].arguments[0];
			assert.deepStrictEqual(callArgs.pageNumber, Number(args.pageNumber));
			assert.deepStrictEqual(callArgs.pageSize, Number(args.pageSize));
			assert.deepStrictEqual(callArgs.filters, { isAdmin: true });
			assert.deepStrictEqual(callArgs.sort, { createdAt: "asc" });
			assert.deepStrictEqual(callArgs.select, userServiceGetAllSelect);
		});

		test("Should return empty items with meta when repo returns empty page", async () => {
			// Arrange
			const meta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 5,
				totalItems: 0,
				totalPages: 0,
			};
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: [], meta },
					success: true,
				}),
			);

			const args: GetAllUsersServiceParams = {
				pageNumber: "1",
				pageSize: "5",
			};

			// Act
			const result = await service.getAll(args);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
			assert.deepStrictEqual(result.data.meta, meta);
		});

		test("Should return 'ValidationError' when pagination args are invalid", async () => {
			// Arrange
			const args: GetAllUsersServiceParams = {
				pageNumber: "0",
				pageSize: "5",
			};

			// Act
			const result = await service.getAll(args);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 0);
		});
	});

	describe("getById", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser.id;
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
			const result = await service.getById({ userId: mockUser.id });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUser);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getById.mock.calls[0].arguments[0].userId,
				expectedUser.id,
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
			const result = await service.getById({ userId: userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when userId is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-objectid";

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
		const userId = mockUser.id;

		const updateData: UpdateUserInput = { name: "new-name", userId };
		const updatedData = { ...mockUser, ...updateData };
		const { password: _, userId: __, ...expectedUpdatedData } = updatedData;

		test("Should return 'user object' without 'password' when 'repo.update' is called once with 'userId' and 'updateData'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: updatedData,
					success: true,
				}),
			);

			// Act
			const result = await service.updateById(updateData);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedUpdatedData);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.update.mock.calls[0].arguments[0],
				updateData,
			);
		});

		test("Should return 'NotFoundError' when 'repo.update' returns 'null'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.updateById(updateData);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when userId is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-objectid";

			// Act
			const result = await service.updateById({
				...updateData,
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
				...invalidUpdateData,
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.update.mock.callCount(), 0);
		});

		test("Should allow demo user to update name", async () => {
			// Arrange
			const demoUser = generateMockSelectUser({
				email: DEMO_ACCOUNT_EMAILS.customer,
			});
			const demoUpdateData: UpdateUserInput = {
				name: "Updated Demo Name",
				userId: demoUser.id,
			};
			const demoUpdatedData = { ...demoUser, ...demoUpdateData };
			const { password: _, userId: __, ...expectedDemoUser } =
				demoUpdatedData;

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: demoUser,
					success: true,
				}),
			);
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: demoUpdatedData,
					success: true,
				}),
			);

			// Act
			const result = await service.updateById(demoUpdateData);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedDemoUser);
			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
		});

		test("Should return 'ForbiddenError' when demo user email is updated", async () => {
			// Arrange
			const demoUser = generateMockSelectUser({
				email: DEMO_ACCOUNT_EMAILS.customer,
			});

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: demoUser,
					success: true,
				}),
			);

			// Act
			const result = await service.updateById({
				email: "new-customer@example.com",
				userId: demoUser.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ForbiddenError);
			assert.strictEqual(mockRepo.update.mock.callCount(), 0);
		});

		test("Should return 'ForbiddenError' when demo user password is updated", async () => {
			// Arrange
			const demoUser = generateMockSelectUser({
				email: DEMO_ACCOUNT_EMAILS.customer,
			});

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: demoUser,
					success: true,
				}),
			);

			// Act
			const result = await service.updateById({
				password: "new-password",
				userId: demoUser.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ForbiddenError);
			assert.strictEqual(mockRepo.update.mock.callCount(), 0);
		});

		test("Should return 'ForbiddenError' when demo user admin status is updated", async () => {
			// Arrange
			const demoUser = generateMockSelectUser({
				email: DEMO_ACCOUNT_EMAILS.customer,
				isAdmin: false,
			});

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: demoUser,
					success: true,
				}),
			);

			// Act
			const result = await service.updateById({
				isAdmin: true,
				userId: demoUser.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ForbiddenError);
			assert.strictEqual(mockRepo.update.mock.callCount(), 0);
		});
	});

	describe("delete", () => {
		const mockUser = generateMockSelectUser();
		const { password: _, ...expectedUser } = mockUser;
		const userId = mockUser.id;

		test("Should return 'user object' when 'repo.delete' is called once with 'userId'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);

			// Act
			const result = await service.delete({ userId: userId });

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
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.delete({ userId: userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when userId is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-objectid";

			// Act
			const result = await service.delete({ userId: invalidUserId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 0);
		});

		test("Should return 'ForbiddenError' when deleting a demo user", async () => {
			// Arrange
			const demoUser = generateMockSelectUser({
				email: DEMO_ACCOUNT_EMAILS.admin,
			});

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: demoUser,
					success: true,
				}),
			);

			// Act
			const result = await service.delete({ userId: demoUser.id });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ForbiddenError);
			assert.strictEqual(mockRepo.delete.mock.callCount(), 0);
		});
	});

	describe("existsByEmail", () => {
		test("Should return 'user id object' when user exists", async () => {
			// Arrange
			const { id: userId, email } = generateMockSelectUser();
			const expectedResult = { id: userId };

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

		test("Should return 'NotFoundError' when user does not exist", async () => {
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
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
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
			const invalidUser = { invalid: "data" } as unknown as User;

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
			const userId = mockUser.id;

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: mockUser,
					success: true,
				}),
			);

			// Act
			const result = await service.getById_UNSAFE({
				userId: userId,
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
			const { id: userId } = generateMockSelectUser();

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			// Act
			const result = await service.getById_UNSAFE({
				userId: userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return 'ValidationError' when userId is invalid", async () => {
			// Arrange
			const invalidUserId = "invalid-objectid";

			// Act
			const result = await service.getById_UNSAFE({ userId: invalidUserId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});
});
