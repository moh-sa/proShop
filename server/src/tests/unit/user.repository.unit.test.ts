import mongoose from "mongoose";
import assert from "node:assert/strict";
import { beforeEach, describe, mock, suite, test } from "node:test";

import type {
	GetAllUsersRepositoryParams,
	InsertUser,
} from "../../types/index.js";

import {
	DatabaseDuplicateKeyError,
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	DatabaseValidationError,
	GenericDatabaseError,
} from "../../errors/index.js";
import User from "../../models/user.model.js";
import { UserRepository } from "../../repositories/index.js";
import { Paginator } from "../../utils/paginator.util.js";
import {
	generateMockInsertUser,
	generateMockInsertUsers,
	generateMockObjectId,
	generateMockSelectUser,
} from "../mocks/index.js";

suite("User Repository〖 Unit Tests 〗", () => {
	const repo = new UserRepository();
	beforeEach(() => mock.reset());

	describe("create", () => {
		test("Should return 'success result' with 'user object' when 'db.create' succeeds", async (t) => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const createMock = t.mock.method(User, "create", async () => ({
				toObject: () => mockUser,
			}));

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockUser);

			assert.strictEqual(createMock.mock.callCount(), 1);
			assert.deepStrictEqual(createMock.mock.calls[0].arguments[0], mockUser);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(User, "create", () => {
				throw validationError;
			});

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseDuplicateKeyError' when 'db.create' throws 'MongoServerError' with code '11000'", async (t) => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const duplicateKeyError = new mongoose.mongo.MongoServerError({});
			duplicateKeyError.code = 11000;
			t.mock.method(User, "create", () => {
				throw duplicateKeyError;
			});

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});

		test("Should return 'failure result' with 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(User, "create", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'failure result' with 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(User, "create", () => {
				throw queryError;
			});

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'failure result' with 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(User, "create", () => {
				throw networkError;
			});

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'failure result' with 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
			// Arrange
			const mockUser = generateMockInsertUser();
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(User, "create", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.create(mockUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAll", () => {
		test("Should return 'success result' with 'array of users' when 'paginator.paginate' succeeds", async (t) => {
			// Arrange
			const mockUsers = generateMockInsertUsers({ count: 5 });

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({ items: mockUsers, meta: {} }),
			);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(args);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data.items, mockUsers);
		});

		test("Should return 'success result' with 'empty array' when 'paginator.paginate' returns 'empty array'", async (t) => {
			// Arrange
			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({ items: [], meta: {} }),
			);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(args);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(args);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(args);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'failure result' with 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(args);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'failure result' with 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(args);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'failure result' with 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			const result = await repo.getAll(args);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});

		test("Should pass args to paginator and return its result", async (t) => {
			// Arrange
			const mockUsers = generateMockInsertUsers({ count: 5 });
			const pageSize = 3;
			const items = mockUsers.slice(pageSize - 1, pageSize * 2);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 2,
				pageSize,
				filters: { isAdmin: true },
				sort: { createdAt: "desc" },
			};

			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({ items, meta: {} }),
			);

			// Act
			const result = await repo.getAll(args);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data.items, items);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				paginateMock.mock.calls[0].arguments[0]?.pageNumber,
				args.pageNumber,
			);
			assert.deepStrictEqual(
				paginateMock.mock.calls[0].arguments[0]?.pageSize,
				args.pageSize,
			);
			assert.deepStrictEqual(paginateMock.mock.calls[0].arguments[0]?.query, {
				isAdmin: true,
			});
			assert.deepStrictEqual(
				paginateMock.mock.calls[0].arguments[0]?.sort,
				args.sort,
			);
		});

		test("Should pass email and isAdmin filters to paginator query unchanged", async (t) => {
			// Arrange
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: {},
				}),
			);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				filters: {
					email: "test@example.com",
					isAdmin: false,
				},
			};

			// Act
			await repo.getAll(args);

			// Assert
			const callArgs = paginateMock.mock.calls[0]?.arguments[0];
			assert.deepStrictEqual(callArgs?.query, args.filters);
		});

		test("Should pass name filter to paginator as case-insensitive regex", async (t) => {
			// Arrange
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: {},
				}),
			);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				filters: { name: "SomeName" },
			};

			// Act
			await repo.getAll(args);

			// Assert
			const callArgs = paginateMock.mock.calls[0]?.arguments[0];
			assert.deepStrictEqual(callArgs?.query?.name, {
				$options: "i",
				$regex: "SomeName",
			});
		});

		test("Should omit query, pipeline, and sort when only pageNumber and pageSize are provided", async (t) => {
			// Arrange
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({ items: [], meta: {} }),
			);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
			};

			// Act
			await repo.getAll(args);

			// Assert
			const callArgs = paginateMock.mock.calls[0]?.arguments[0];
			assert.strictEqual(callArgs?.query, undefined);
			assert.strictEqual(callArgs?.pipeline, undefined);
			assert.strictEqual(callArgs?.sort, undefined);
		});

		test("Should pass select to paginator as $project pipeline stage", async (t) => {
			// Arrange
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: {},
				}),
			);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				select: { _id: true, email: true },
			};

			// Act
			await repo.getAll(args);

			// Assert
			const callArgs = paginateMock.mock.calls[0]?.arguments[0];
			assert.deepStrictEqual(callArgs?.pipeline, [
				{ $project: { _id: 1, email: 1 } },
			]);
		});

		test("Should pass sort through to paginator", async (t) => {
			// Arrange
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: {},
				}),
			);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 10,
				sort: { updatedAt: "asc" },
			};

			// Act
			await repo.getAll(args);

			// Assert
			const callArgs = paginateMock.mock.calls[0]?.arguments[0];
			assert.deepStrictEqual(callArgs?.sort, args.sort);
		});

		test("Should pass filters, select pipeline, and sort together in one paginate call", async (t) => {
			// Arrange
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: {},
				}),
			);

			const args: GetAllUsersRepositoryParams = {
				pageNumber: 1,
				pageSize: 5,
				filters: { isAdmin: true },
				select: { _id: true, email: true },
				sort: { createdAt: "desc" },
			};

			// Act
			await repo.getAll(args);

			const callArgs = paginateMock.mock.calls[0]?.arguments[0];
			assert.deepStrictEqual(callArgs?.query, { isAdmin: true });
			assert.deepStrictEqual(callArgs?.pipeline, [
				{ $project: { _id: 1, email: 1 } },
			]);
			assert.deepStrictEqual(callArgs?.sort, args.sort);
		});
	});

	describe("getById", () => {
		test("Should return 'success result' with 'user object' when 'db.findById' succeeds", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const findByIdMock = t.mock.method(User, "findById", () => ({
				lean: async () => mockUser,
			}));

			// Act
			const result = await repo.getById({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockUser);
			assert.strictEqual(findByIdMock.mock.callCount(), 1);
			assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], userId);
		});

		test("Should return 'success result' with 'null' when 'db.findById' returns 'null'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			t.mock.method(User, "findById", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.getById({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(User, "findById", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getById({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(User, "findById", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getById({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'failure result' with 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(User, "findById", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getById({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'failure result' with 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(User, "findById", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getById({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'failure result' with 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(User, "findById", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getById({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getByEmail", () => {
		test("Should return 'success result' with 'user object' when 'db.findOne' succeeds", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const email = mockUser.email;
			const findOneMock = t.mock.method(User, "findOne", () => ({
				lean: async () => mockUser,
			}));

			// Act
			const result = await repo.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockUser);
			assert.strictEqual(findOneMock.mock.callCount(), 1);
			assert.deepStrictEqual(findOneMock.mock.calls[0].arguments[0], { email });
		});

		test("Should return 'success result' with 'null' when 'db.findOne' returns 'null'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const email = mockUser.email;
			t.mock.method(User, "findOne", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when 'db.findOne' throws 'ValidationError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const email = mockUser.email;
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(User, "findOne", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseTimeoutError' when 'db.findOne' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const email = mockUser.email;
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(User, "findOne", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'failure result' with 'DatabaseQueryError' when 'db.findOne' throws 'MongooseError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const email = mockUser.email;
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(User, "findOne", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'failure result' with 'DatabaseNetworkError' when 'db.findOne' throws 'MongoError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const email = mockUser.email;
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(User, "findOne", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'failure result' with 'GenericDatabaseError' when 'db.findOne' throws unknown error", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const email = mockUser.email;
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(User, "findOne", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("update", () => {
		test("Should return 'success result' with 'updated user object' when 'db.findByIdAndUpdate' succeeds", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const updateData: Partial<InsertUser> = { name: "Updated Name" };
			const expectedResult = { ...mockUser, ...updateData };
			const findByIdAndUpdateMock = t.mock.method(
				User,
				"findByIdAndUpdate",
				() => ({
					lean: async () => expectedResult,
				}),
			);

			// Act
			const result = await repo.update({ data: updateData, userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedResult);

			assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				findByIdAndUpdateMock.mock.calls[0].arguments[0],
				userId,
			);
			assert.deepStrictEqual(
				findByIdAndUpdateMock.mock.calls[0].arguments[1],
				updateData,
			);
		});

		test("Should return 'success result' with 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const updateData: Partial<InsertUser> = { name: "Updated Name" };
			t.mock.method(User, "findByIdAndUpdate", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.update({ data: updateData, userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const updateData: Partial<InsertUser> = { name: "Updated Name" };
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(User, "findByIdAndUpdate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.update({ data: updateData, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseDuplicateKeyError' when 'db.findByIdAndUpdate' throws 'MongoServerError' with code '11000'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const updateData: Partial<InsertUser> = { name: "Updated Name" };
			const duplicateKeyError = new mongoose.mongo.MongoServerError({});
			duplicateKeyError.code = 11000;
			t.mock.method(User, "findByIdAndUpdate", () => {
				throw duplicateKeyError;
			});

			// Act
			const result = await repo.update({ data: updateData, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});

		test("Should return 'failure result' with 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const updateData: Partial<InsertUser> = { name: "Updated Name" };
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(User, "findByIdAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.update({ data: updateData, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'failure result' with 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const updateData: Partial<InsertUser> = { name: "Updated Name" };
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(User, "findByIdAndUpdate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.update({ data: updateData, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'failure result' with 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const updateData: Partial<InsertUser> = { name: "Updated Name" };
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(User, "findByIdAndUpdate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.update({ data: updateData, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'failure result' with 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const updateData: Partial<InsertUser> = { name: "Updated Name" };
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(User, "findByIdAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.update({ data: updateData, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("delete", () => {
		test("Should return 'success result' with 'deleted user object' when 'db.findByIdAndDelete' succeeds", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const findByIdAndDeleteMock = t.mock.method(
				User,
				"findByIdAndDelete",
				() => ({
					lean: async () => mockUser,
				}),
			);

			// Act
			const result = await repo.delete({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockUser);

			assert.strictEqual(findByIdAndDeleteMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				findByIdAndDeleteMock.mock.calls[0].arguments[0],
				userId,
			);
		});

		test("Should return 'success result' with 'null' when 'db.findByIdAndDelete' returns 'null'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			t.mock.method(User, "findByIdAndDelete", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.delete({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when 'db.findByIdAndDelete' throws 'ValidationError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(User, "findByIdAndDelete", () => {
				throw validationError;
			});

			// Act
			const result = await repo.delete({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseTimeoutError' when 'db.findByIdAndDelete' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(User, "findByIdAndDelete", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.delete({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'failure result' with 'DatabaseQueryError' when 'db.findByIdAndDelete' throws 'MongooseError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(User, "findByIdAndDelete", () => {
				throw queryError;
			});

			// Act
			const result = await repo.delete({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'failure result' with 'DatabaseNetworkError' when 'db.findByIdAndDelete' throws 'MongoError'", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(User, "findByIdAndDelete", () => {
				throw networkError;
			});

			// Act
			const result = await repo.delete({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'failure result' with 'GenericDatabaseError' when 'db.findByIdAndDelete' throws unknown error", async (t) => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const userId = mockUser._id;
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(User, "findByIdAndDelete", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.delete({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("existsByEmail", () => {
		test("Should return 'success result' with 'userId' when 'db.exists' succeeds", async (t) => {
			// Arrange
			const email = "exists@example.com";
			const expectedResult = { _id: generateMockObjectId() };
			const existsMock = t.mock.method(User, "exists", () => ({
				lean: async () => expectedResult,
			}));

			// Act
			const result = await repo.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedResult);

			assert.strictEqual(existsMock.mock.callCount(), 1);
			assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], { email });
		});

		test("Should return 'success result' with 'null' when 'db.exists' returns 'null'", async (t) => {
			// Arrange
			const email = "exists@example.com";
			t.mock.method(User, "exists", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'failure result' with 'DatabaseValidationError' when 'db.exists' throws 'ValidationError'", async (t) => {
			// Arrange
			const email = "exists@example.com";
			const validationError = new mongoose.Error.ValidationError();
			t.mock.method(User, "exists", () => {
				throw validationError;
			});

			// Act
			const result = await repo.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'failure result' with 'DatabaseTimeoutError' when 'db.exists' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const email = "exists@example.com";
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);
			t.mock.method(User, "exists", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'failure result' with 'DatabaseQueryError' when 'db.exists' throws 'MongooseError'", async (t) => {
			// Arrange
			const email = "exists@example.com";
			const queryError = new mongoose.Error("Query failed");
			t.mock.method(User, "exists", () => {
				throw queryError;
			});

			// Act
			const result = await repo.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'failure result' with 'DatabaseNetworkError' when 'db.exists' throws 'MongoError'", async (t) => {
			// Arrange
			const email = "exists@example.com";
			const networkError = new mongoose.mongo.MongoError("Network error");
			t.mock.method(User, "exists", () => {
				throw networkError;
			});

			// Act
			const result = await repo.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'failure result' with 'GenericDatabaseError' when 'db.exists' throws unknown error", async (t) => {
			// Arrange
			const email = "exists@example.com";
			const unknownError = new Error("Something unexpected happened");
			t.mock.method(User, "exists", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.existsByEmail({ email });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});
});
