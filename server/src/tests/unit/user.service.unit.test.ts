import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import type { InsertUser } from "../../types/index.js";

import { NotFoundError } from "../../errors/index.js";
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
			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			const user = await service.create(mockInsertUser);

			assert.ok(user);
			assert.deepStrictEqual(user, expectedUser);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockInsertUser,
			);
		});
	});

	describe("getAll", () => {
		const mockUsers = generateMockSelectUsers({ count: 5 });
		const expectedUsers = mockUsers.map((user) => {
			const { password: _, ...expectedUser } = user;
			return expectedUser;
		});

		test("Should return 'array of users' when 'repo.getAll' is called once with no args", async () => {
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUsers),
			);

			const users = await service.getAll();

			assert.ok(users);
			assert.deepStrictEqual(users, expectedUsers);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
		});

		test("Should return 'empty array' when 'repo.getAll' returns 'empty array'", async () => {
			mockRepo.getAll.mock.mockImplementationOnce(() => Promise.resolve([]));

			const users = await service.getAll();

			assert.strictEqual(users.length, 0);
		});
	});

	describe("getById", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id;
		const { password: _, ...expectedUser } = mockUser;

		test("Should return 'user object' when 'repo.getById' is called once with 'userId'", async () => {
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			const user = await service.getById({ userId: mockUser._id });

			assert.ok(user);
			assert.deepStrictEqual(user, expectedUser);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
				userId: expectedUser._id,
			});
		});

		test("Should throw 'NotFoundError' when 'repo.getById' returns 'null'", async () => {
			mockRepo.getById.mock.mockImplementationOnce(() => Promise.resolve(null));

			await assert.rejects(
				async () => await service.getById({ userId }),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "User not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});
	});

	describe("getByEmail", () => {
		const mockUser = generateMockSelectUser();
		const { password: _, ...expectedUser } = mockUser;
		const email = mockUser.email;

		test("Should return 'user object' when 'repo.getByEmail' is called once with 'email'", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			const user = await service.getByEmail({ email });

			assert.ok(user);
			assert.deepStrictEqual(user, expectedUser);

			assert.strictEqual(mockRepo.getByEmail.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getByEmail.mock.calls[0].arguments[0], {
				email,
			});
		});

		test("Should throw 'NotFoundError' when 'repo.getByEmail' returns 'null'", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(null),
			);

			await assert.rejects(
				async () => await service.getByEmail({ email }),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.type, "NOT_FOUND");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});
	});

	describe("update", () => {
		const mockUser = generateMockSelectUser();
		const userId = mockUser._id;

		const updateData: Partial<InsertUser> = { name: "new-name" };
		const updatedData = { ...mockUser, ...updateData };
		const { password: _, ...expectedUpdatedData } = updatedData;

		test("Should return 'user object' without 'password' and 'token' when 'repo.update' is called once with 'userId' and 'updateData'", async () => {
			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve(updatedData),
			);

			const updatedUser = await service.updateById({
				data: updateData,
				userId,
			});

			assert.ok(updatedUser);
			assert.deepStrictEqual(updatedUser, expectedUpdatedData);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.update.mock.calls[0].arguments[0], {
				data: updateData,
				userId,
			});
		});

		test("Should throw 'NotFoundError' when 'repo.update' returns 'null'", async () => {
			mockRepo.update.mock.mockImplementationOnce(() => Promise.resolve(null));

			await assert.rejects(
				async () => await service.updateById({ data: updateData, userId }),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.type, "NOT_FOUND");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});
	});

	describe("delete", () => {
		const mockUser = generateMockSelectUser();
		const { password: _, ...expectedUser } = mockUser;
		const userId = mockUser._id;

		test("Should return 'user object' when 'repo.delete' is called once with 'userId'", async () => {
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			const deletedUser = await service.delete({ userId });

			assert.ok(deletedUser);
			assert.deepStrictEqual(deletedUser, expectedUser);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.delete.mock.calls[0].arguments[0], {
				userId,
			});
		});

		test("Should throw 'NotFoundError' when 'repo.delete' returns 'null'", async () => {
			mockRepo.delete.mock.mockImplementationOnce(() => Promise.resolve(null));

			await assert.rejects(
				async () => await service.delete({ userId }),
				NotFoundError,
			);
		});
	});
});
