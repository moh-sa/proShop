import mongoose from "mongoose";
import assert from "node:assert/strict";
import { describe, suite, test } from "node:test";

import {
	DatabaseDuplicateKeyError,
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	DatabaseValidationError,
	GenericDatabaseError,
} from "../../errors/index.js";
import { Session } from "../../models/session.model.js";
import { SessionRepository } from "../../repositories/index.js";
import { Paginator } from "../../utils/paginator.util.js";
import {
	generateMockInsertSession,
	generateMockObjectId,
	generateMockSelectSession,
	generateMockSelectSessions,
} from "../mocks/index.js";

suite("Session Repository〖 Unit Tests 〗", () => {
	const repo = new SessionRepository();

	describe("create", () => {
		const mockSession = generateMockInsertSession();

		test("Should return 'session object' when 'db.create' is called once with 'session data'", async (t) => {
			// Arrange
			const createMock = t.mock.method(Session, "create", async () => ({
				toObject: () => mockSession,
			}));

			// Act
			const session = await repo.create(mockSession);

			// Assert
			assert.strictEqual(session.success, true);
			assert.deepStrictEqual(session.data, mockSession);

			assert.strictEqual(createMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				createMock.mock.calls[0].arguments[0],
				mockSession,
			);
		});

		test("Should return 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "create", () => {
				throw validationError;
			});

			const result = await repo.create(mockSession);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseDuplicateKeyError' when 'db.create' throws 'MongoServerError' with code '11000'", async (t) => {
			// Arrange
			const duplicateError = new mongoose.mongo.MongoServerError({});
			duplicateError.code = 11000;

			t.mock.method(Session, "create", () => {
				throw duplicateError;
			});

			const result = await repo.create(mockSession);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "create", () => {
				throw timeoutError;
			});

			const result = await repo.create(mockSession);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "create", () => {
				throw queryError;
			});

			// Act
			const result = await repo.create(mockSession);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "create", () => {
				throw networkError;
			});

			// Act
			const result = await repo.create(mockSession);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "create", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.create(mockSession);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAll", () => {
		const mockSessions = generateMockSelectSessions({ count: 5 });
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 5,
			totalPages: 1,
		};

		test("Should return 'paginated sessions' when 'paginator.paginate' is called once with pagination params", async (t) => {
			// Arrange
			const pageNumber = 1;
			const pageSize = 10;
			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockSessions,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			const result = await repo.getAll({
				pageNumber,
				pageSize,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.ok(result.data.items);
			assert.ok(result.data.meta);

			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, mockSessions.length);
			assert.deepStrictEqual(result.data.items, mockSessions);
			assert.deepStrictEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.ok(paginateMock.mock.calls[0].arguments[0]);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageNumber,
				pageNumber,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageSize,
				pageSize,
			);
		});

		test("Should return 'empty paginated result' when 'paginator.paginate' returns empty items", async (t) => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: emptyMeta,
				}),
			);

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
			assert.deepStrictEqual(result.data.meta, emptyMeta);
		});

		test("Should return 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAllActiveByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const mockSessions = generateMockSelectSessions({
			count: 2,
			options: { userId: userIdObj },
		});
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 2,
			totalPages: 1,
		};

		test("Should return 'paginated active sessions' when 'paginator.paginate' is called once with active filter", async (t) => {
			// Arrange
			const pageNumber = 1;
			const pageSize = 10;

			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockSessions,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			const result = await repo.getAllActiveByUserId({
				pageNumber,
				pageSize,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, mockSessions.length);
			assert.deepStrictEqual(result.data.items, mockSessions);

			assert.deepStrictEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.ok(paginateMock.mock.calls[0].arguments[0]);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageNumber,
				pageNumber,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageSize,
				pageSize,
			);
			assert.ok(
				paginateMock.mock.calls[0].arguments[0].query?.expiresAt.$gt instanceof
					Date,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].query?.revokedAt,
				null,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].query?.userId,
				userId,
			);
		});

		test("Should return 'empty paginated result' when 'paginator.paginate' returns empty items", async (t) => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: emptyMeta,
				}),
			);

			// Act
			const result = await repo.getAllActiveByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
			assert.deepStrictEqual(result.data.meta, emptyMeta);
		});

		test("Should return 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAllActiveByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllActiveByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllActiveByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllActiveByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllActiveByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAllByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const mockSessions = generateMockSelectSessions({
			count: 3,
			options: { userId: userIdObj },
		});
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 3,
			totalPages: 1,
		};

		test("Should return 'paginated sessions by user' when 'paginator.paginate' is called once with userId filter", async (t) => {
			// Arrange
			const pageNumber = 1;
			const pageSize = 10;

			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockSessions,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			const result = await repo.getAllByUserId({
				pageNumber,
				pageSize,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, mockSessions.length);
			assert.deepStrictEqual(result.data.items, mockSessions);

			assert.deepStrictEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.ok(paginateMock.mock.calls[0].arguments[0]);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageNumber,
				pageNumber,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageSize,
				pageSize,
			);
			assert.deepStrictEqual(paginateMock.mock.calls[0].arguments[0].query, {
				userId,
			});
		});

		test("Should return 'empty paginated result' when 'paginator.paginate' returns empty items", async (t) => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: emptyMeta,
				}),
			);

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
			assert.deepStrictEqual(result.data.meta, emptyMeta);
		});

		test("Should return 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAllRevoked", () => {
		const mockSessions = generateMockSelectSessions({
			count: 2,
			options: { revokedAt: new Date() },
		});
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 2,
			totalPages: 1,
		};

		test("Should return 'paginated revoked sessions' when 'paginator.paginate' is called once with revoked filter", async (t) => {
			// Arrange
			const pageNumber = 1;
			const pageSize = 10;

			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockSessions,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			const result = await repo.getAllRevoked({
				pageNumber,
				pageSize,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, mockSessions.length);
			assert.deepStrictEqual(result.data.items, mockSessions);

			assert.deepStrictEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.ok(paginateMock.mock.calls[0].arguments[0]);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageNumber,
				pageNumber,
			);
			assert.strictEqual(
				paginateMock.mock.calls[0].arguments[0].pageSize,
				pageSize,
			);
			assert.deepStrictEqual(paginateMock.mock.calls[0].arguments[0].query, {
				revokedAt: { $ne: null },
			});
		});

		test("Should return 'empty paginated result' when 'paginator.paginate' returns empty items", async (t) => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: emptyMeta,
				}),
			);

			// Act
			const result = await repo.getAllRevoked({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
			assert.deepStrictEqual(result.data.meta, emptyMeta);
		});

		test("Should return 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAllRevoked({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllRevoked({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllRevoked({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllRevoked({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllRevoked({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAllRevokedByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const mockSessions = generateMockSelectSessions({
			count: 2,
			options: { revokedAt: new Date(), userId: userIdObj },
		});
		const mockPaginationMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 2,
			totalPages: 1,
		};

		test("Should return 'paginated revoked sessions by user' when 'paginator.paginate' is called once with revoked+userId filter", async (t) => {
			// Arrange
			const pageNumber = 1;
			const pageSize = 10;

			const paginateMock = t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: mockSessions,
					meta: mockPaginationMeta,
				}),
			);

			// Act
			const result = await repo.getAllRevokedByUserId({
				pageNumber,
				pageSize,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, mockSessions.length);
			assert.deepStrictEqual(result.data.items, mockSessions);

			assert.deepStrictEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(paginateMock.mock.callCount(), 1);
			assert.ok(paginateMock.mock.calls[0].arguments[0]);
			assert.strictEqual(paginateMock.mock.calls[0].arguments[0].pageNumber, 1);
			assert.strictEqual(paginateMock.mock.calls[0].arguments[0].pageSize, 10);
			assert.deepStrictEqual(paginateMock.mock.calls[0].arguments[0].query, {
				revokedAt: { $ne: null },
				userId,
			});
		});

		test("Should return 'empty paginated result' when 'paginator.paginate' returns empty items", async (t) => {
			// Arrange
			const emptyMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			t.mock.method(Paginator.prototype, "paginate", () =>
				Promise.resolve({
					items: [],
					meta: emptyMeta,
				}),
			);

			// Act
			const result = await repo.getAllRevokedByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
			assert.deepStrictEqual(result.data.meta, emptyMeta);
		});

		test("Should return 'DatabaseValidationError' when 'paginator.paginate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAllRevokedByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'paginator.paginate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllRevokedByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'paginator.paginate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllRevokedByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'paginator.paginate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllRevokedByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'paginator.paginate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Paginator.prototype, "paginate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllRevokedByUserId({
				pageNumber: 1,
				pageSize: 10,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getByTokenIdAndUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const tokenId = "jwt-token-id";
		const mockSession = generateMockSelectSession({
			tokenId,
			userId: userIdObj,
		});

		test("Should return 'session object' when 'db.findOne' is called once with 'tokenId+userId'", async (t) => {
			// Arrange
			const findOneMock = t.mock.method(Session, "findOne", () => ({
				lean: async () => mockSession,
			}));

			// Act
			const session = await repo.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(session.success, true);
			assert.ok(session.data);
			assert.deepStrictEqual(session.data, mockSession);

			assert.strictEqual(findOneMock.mock.callCount(), 1);
			assert.deepStrictEqual(findOneMock.mock.calls[0].arguments[0], {
				tokenId,
				userId,
			});
		});

		test("Should return 'null' when 'db.findOne' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Session, "findOne", () => ({
				lean: async () => null,
			}));

			// Act
			const session = await repo.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(session.success, true);
			assert.strictEqual(session.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findOne' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "findOne", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findOne' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "findOne", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findOne' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "findOne", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findOne' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "findOne", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findOne' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "findOne", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("updateByTokenIdAndUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const tokenId = "jwt-token-id";
		const updateData = { expiresAt: new Date(Date.now() + 1000 * 60 * 60) };
		const expected = generateMockSelectSession({
			tokenId,
			userId: userIdObj,
			...updateData,
		});

		test("Should return 'session object' when 'db.findOneAndUpdate' is called once with 'tokenId+userId' and 'data'", async (t) => {
			// Arrange
			const findOneAndUpdateMock = t.mock.method(
				Session,
				"findOneAndUpdate",
				() => ({
					lean: async () => expected,
				}),
			);

			// Act
			const session = await repo.updateByTokenIdAndUserId({
				data: updateData,
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(session.success, true);
			assert.ok(session.data);
			assert.deepStrictEqual(session.data, expected);

			assert.strictEqual(findOneAndUpdateMock.mock.callCount(), 1);
			assert.deepStrictEqual(findOneAndUpdateMock.mock.calls[0].arguments[0], {
				tokenId,
				userId,
			});
			assert.deepStrictEqual(
				findOneAndUpdateMock.mock.calls[0].arguments[1],
				updateData,
			);
			assert.deepStrictEqual(findOneAndUpdateMock.mock.calls[0].arguments[2], {
				new: true,
			});
		});

		test("Should return 'null' when 'db.findOneAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Session, "findOneAndUpdate", () => ({
				lean: async () => null,
			}));

			// Act
			const session = await repo.updateByTokenIdAndUserId({
				data: updateData,
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(session.success, true);
			assert.strictEqual(session.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findOneAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.updateByTokenIdAndUserId({
				data: updateData,
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseDuplicateKeyError' when 'db.findOneAndUpdate' throws 'MongoServerError' with code '11000'", async (t) => {
			// Arrange
			const duplicateError = new mongoose.mongo.MongoServerError({});
			duplicateError.code = 11000;

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw duplicateError;
			});

			// Act
			const result = await repo.updateByTokenIdAndUserId({
				data: updateData,
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseDuplicateKeyError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findOneAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.updateByTokenIdAndUserId({
				data: updateData,
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findOneAndUpdate' throws 'MongooseError'", async (t) => {
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.updateByTokenIdAndUserId({
				data: updateData,
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findOneAndUpdate' throws 'MongoError'", async (t) => {
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.updateByTokenIdAndUserId({
				data: updateData,
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findOneAndUpdate' throws unknown error", async (t) => {
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.updateByTokenIdAndUserId({
				data: updateData,
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("revokeAllByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();

		test("Should return 'modified count' when 'db.updateMany' is called once with 'userId' and 'revokedAt'", async (t) => {
			// Arrange
			const expected = 2;
			const updateManyMock = t.mock.method(Session, "updateMany", () => ({
				lean: async () => ({ modifiedCount: expected }),
			}));

			// Act
			const modifiedCount = await repo.revokeAllByUserId({ userId });

			// Assert
			assert.strictEqual(modifiedCount.success, true);
			assert.strictEqual(modifiedCount.data, expected);

			assert.strictEqual(updateManyMock.mock.callCount(), 1);
			assert.deepStrictEqual(updateManyMock.mock.calls[0].arguments[0], {
				userId,
			});
			const updateArg = updateManyMock.mock.calls[0].arguments[1] as {
				revokedAt: Date;
			};
			assert.ok(updateArg.revokedAt instanceof Date);
		});

		test("Should return 'DatabaseValidationError' when 'db.updateMany' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "updateMany", () => {
				throw validationError;
			});

			// Act
			const result = await repo.revokeAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.updateMany' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "updateMany", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.revokeAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.updateMany' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "updateMany", () => {
				throw queryError;
			});

			// Act
			const result = await repo.revokeAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.updateMany' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "updateMany", () => {
				throw networkError;
			});

			// Act
			const result = await repo.revokeAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.updateMany' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "updateMany", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.revokeAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("revokeByTokenIdAndUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const tokenId = "jwt-token-id";
		const expected = generateMockSelectSession({
			revokedAt: new Date(),
			tokenId,
			userId: userIdObj,
		});

		test("Should return 'session object' when 'db.findOneAndUpdate' is called once with 'tokenId+userId' and sets 'revokedAt'", async (t) => {
			// Arrange
			const findOneAndUpdateMock = t.mock.method(
				Session,
				"findOneAndUpdate",
				() => ({
					lean: async () => expected,
				}),
			);

			// Act
			const session = await repo.revokeByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(session.success, true);
			assert.deepStrictEqual(session.data, expected);

			assert.strictEqual(findOneAndUpdateMock.mock.callCount(), 1);
			assert.deepStrictEqual(findOneAndUpdateMock.mock.calls[0].arguments[0], {
				tokenId,
				userId,
			});
			const updateArg = findOneAndUpdateMock.mock.calls[0].arguments[1] as {
				revokedAt: Date;
			};
			assert.ok(updateArg.revokedAt instanceof Date);
		});

		test("Should return 'null' when 'db.findOneAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Session, "findOneAndUpdate", () => ({
				lean: async () => null,
			}));

			// Act
			const session = await repo.revokeByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(session.success, true);
			assert.strictEqual(session.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findOneAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw validationError;
			});

			// Act
			const result = await repo.revokeByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findOneAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.revokeByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findOneAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw queryError;
			});

			// Act
			const result = await repo.revokeByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findOneAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw networkError;
			});

			// Act
			const result = await repo.revokeByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findOneAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "findOneAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.revokeByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("deleteAllByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();

		test("Should return 'deleted count' when 'db.deleteMany' is called once with 'userId'", async (t) => {
			// Arrange
			const expected = 3;
			const deleteManyMock = t.mock.method(Session, "deleteMany", () => ({
				lean: async () => ({ deletedCount: expected }),
			}));

			// Act
			const deletedCount = await repo.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(deletedCount.success, true);
			assert.strictEqual(deletedCount.data, expected);

			assert.strictEqual(deleteManyMock.mock.callCount(), 1);
			assert.deepStrictEqual(deleteManyMock.mock.calls[0].arguments[0], {
				userId,
			});
		});

		test("Should return 'DatabaseValidationError' when 'db.deleteMany' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "deleteMany", () => {
				throw validationError;
			});

			// Act
			const result = await repo.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.deleteMany' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "deleteMany", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.deleteMany' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "deleteMany", () => {
				throw queryError;
			});

			// Act
			const result = await repo.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.deleteMany' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "deleteMany", () => {
				throw networkError;
			});

			// Act
			const result = await repo.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.deleteMany' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "deleteMany", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("deleteByTokenIdAndUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const tokenId = "jwt-token-id";
		const mockSession = generateMockSelectSession({
			tokenId,
			userId: userIdObj,
		});

		test("Should return 'session object' when 'db.findOneAndDelete' is called once with 'tokenId+userId'", async (t) => {
			// Arrange
			const findOneAndDeleteMock = t.mock.method(
				Session,
				"findOneAndDelete",
				() => ({
					lean: async () => mockSession,
				}),
			);

			// Act
			const session = await repo.deleteByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(session.success, true);
			assert.ok(session.data);
			assert.deepStrictEqual(session.data, mockSession);

			assert.strictEqual(findOneAndDeleteMock.mock.callCount(), 1);
			assert.deepStrictEqual(findOneAndDeleteMock.mock.calls[0].arguments[0], {
				tokenId,
				userId,
			});
		});

		test("Should return 'null' when 'db.findOneAndDelete' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Session, "findOneAndDelete", () => ({
				lean: async () => null,
			}));

			// Act
			const session = await repo.deleteByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(session.success, true);
			assert.strictEqual(session.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findOneAndDelete' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "findOneAndDelete", () => {
				throw validationError;
			});

			// Act
			const result = await repo.deleteByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findOneAndDelete' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "findOneAndDelete", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.deleteByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findOneAndDelete' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "findOneAndDelete", () => {
				throw queryError;
			});

			// Act
			const result = await repo.deleteByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findOneAndDelete' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "findOneAndDelete", () => {
				throw networkError;
			});

			// Act
			const result = await repo.deleteByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findOneAndDelete' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "findOneAndDelete", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.deleteByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("countActiveByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();

		test("Should return 'count' when 'db.countDocuments' is called once with 'active filter'", async (t) => {
			// Arrange
			const expected = 4;
			const countMock = t.mock.method(
				Session,
				"countDocuments",
				async () => expected,
			);

			// Act
			const count = await repo.countActiveByUserId({ userId });

			// Assert
			assert.strictEqual(count.success, true);
			assert.strictEqual(count.data, expected);

			assert.strictEqual(countMock.mock.callCount(), 1);

			const [filterArg] = countMock.mock.calls[0].arguments as Array<unknown>;
			const filter = filterArg as {
				expiresAt: { $gt: Date };
				revokedAt: null;
				userId: string;
			};
			assert.ok(filter.expiresAt.$gt instanceof Date);
			assert.strictEqual(filter.revokedAt, null);
			assert.strictEqual(filter.userId, userId);
		});

		test("Should return 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "countDocuments", () => {
				throw validationError;
			});

			// Act
			const result = await repo.countActiveByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "countDocuments", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.countActiveByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "countDocuments", () => {
				throw queryError;
			});

			// Act
			const result = await repo.countActiveByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "countDocuments", () => {
				throw networkError;
			});

			// Act
			const result = await repo.countActiveByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "countDocuments", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.countActiveByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("existsByTokenIdAndUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const tokenId = "jwt-token-id";
		const expectedResult = { _id: generateMockObjectId() };

		test("Should return 'document id' when 'db.exists' is called once with 'tokenId+userId'", async (t) => {
			// Arrange
			const existsMock = t.mock.method(Session, "exists", () => ({
				lean: async () => expectedResult,
			}));

			// Act
			const result = await repo.existsByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.deepStrictEqual(result.data, expectedResult);

			assert.strictEqual(existsMock.mock.callCount(), 1);
			assert.deepStrictEqual(existsMock.mock.calls[0].arguments[0], {
				tokenId,
				userId,
			});
		});

		test("Should return 'null' when 'db.exists' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Session, "exists", () => ({
				lean: async () => null,
			}));

			// Act
			const result = await repo.existsByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.exists' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "exists", () => {
				throw validationError;
			});

			// Act
			const result = await repo.existsByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.exists' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "exists", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.existsByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.exists' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "exists", () => {
				throw queryError;
			});

			// Act
			const result = await repo.existsByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.exists' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "exists", () => {
				throw networkError;
			});

			// Act
			const result = await repo.existsByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.exists' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "exists", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.existsByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});
});
