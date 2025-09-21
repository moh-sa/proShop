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
			const createMock = t.mock.method(Session, "create", async () => ({
				toObject: () => mockSession,
			}));

			const session = await repo.create(mockSession);

			assert.ok(session);
			assert.deepStrictEqual(session, mockSession);

			assert.strictEqual(createMock.mock.callCount(), 1);
			assert.deepStrictEqual(
				createMock.mock.calls[0].arguments[0],
				mockSession,
			);
		});

		test("Should throw 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "create", () => {
				throw validationError;
			});

			await assert.rejects(
				async () => await repo.create(mockSession),
				DatabaseValidationError,
			);
		});

		test("Should throw 'DatabaseDuplicateKeyError' when 'db.create' throws 'MongoServerError' with code '11000'", async (t) => {
			const duplicateError = new mongoose.mongo.MongoServerError({});
			duplicateError.code = 11000;

			t.mock.method(Session, "create", () => {
				throw duplicateError;
			});

			await assert.rejects(
				async () => await repo.create(mockSession),
				DatabaseDuplicateKeyError,
			);
		});

		test("Should throw 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "create", () => {
				throw timeoutError;
			});

			await assert.rejects(
				async () => await repo.create(mockSession),
				DatabaseTimeoutError,
			);
		});

		test("Should throw 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "create", () => {
				throw queryError;
			});

			await assert.rejects(
				async () => await repo.create(mockSession),
				DatabaseQueryError,
			);
		});

		test("Should throw 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "create", () => {
				throw networkError;
			});

			await assert.rejects(
				async () => await repo.create(mockSession),
				DatabaseNetworkError,
			);
		});

		test("Should throw 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "create", () => {
				throw unknownError;
			});

			await assert.rejects(
				async () => await repo.create(mockSession),
				GenericDatabaseError,
			);
		});
	});

	describe("getAll", () => {
		const mockSessions = generateMockSelectSessions({ count: 5 });

		test("Should return 'array of sessions' when 'db.find' is called once with '{}'", async (t) => {
			const findMock = t.mock.method(Session, "find", () => ({
				lean: async () => mockSessions,
			}));

			const sessions = await repo.getAll();

			assert.ok(sessions);
			assert.deepStrictEqual(sessions, mockSessions);

			assert.strictEqual(findMock.mock.callCount(), 1);
			assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {});
		});

		test("Should return 'empty array' when 'db.find' returns 'empty array'", async (t) => {
			t.mock.method(Session, "find", () => ({
				lean: async () => [],
			}));

			const sessions = await repo.getAll();
			assert.strictEqual(sessions.length, 0);
		});

		test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "find", () => {
				throw validationError;
			});

			await assert.rejects(
				async () => await repo.getAll(),
				DatabaseValidationError,
			);
		});

		test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "find", () => {
				throw timeoutError;
			});

			await assert.rejects(
				async () => await repo.getAll(),
				DatabaseTimeoutError,
			);
		});

		test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "find", () => {
				throw queryError;
			});

			await assert.rejects(async () => await repo.getAll(), DatabaseQueryError);
		});

		test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "find", () => {
				throw networkError;
			});

			await assert.rejects(
				async () => await repo.getAll(),
				DatabaseNetworkError,
			);
		});

		test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "find", () => {
				throw unknownError;
			});

			await assert.rejects(
				async () => await repo.getAll(),
				GenericDatabaseError,
			);
		});
	});

	describe("getAllActiveByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const mockSessions = generateMockSelectSessions({
			count: 2,
			options: { userId: userIdObj },
		});

		test("Should return 'array of active sessions' when 'db.find' is called once with 'active filter'", async (t) => {
			const findMock = t.mock.method(Session, "find", () => ({
				lean: async () => mockSessions,
			}));

			const sessions = await repo.getAllActiveByUserId({ userId });

			assert.ok(sessions);
			assert.deepStrictEqual(sessions, mockSessions);

			assert.strictEqual(findMock.mock.callCount(), 1);
			const [filterArg] = findMock.mock.calls[0].arguments as Array<unknown>;
			const filter = filterArg as {
				expiresAt: { $gt: Date };
				revokedAt: null;
				userId: string;
			};
			assert.ok(filter.expiresAt.$gt instanceof Date);
			assert.strictEqual(filter.revokedAt, null);
			assert.strictEqual(filter.userId, userId);
		});

		test("Should return 'empty array' when 'db.find' returns 'empty array'", async (t) => {
			t.mock.method(Session, "find", () => ({
				lean: async () => [],
			}));

			const sessions = await repo.getAllActiveByUserId({ userId });
			assert.strictEqual(sessions.length, 0);
		});

		test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "find", () => {
				throw validationError;
			});

			await assert.rejects(
				async () => await repo.getAllActiveByUserId({ userId }),
				DatabaseValidationError,
			);
		});

		test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "find", () => {
				throw timeoutError;
			});

			await assert.rejects(
				async () => await repo.getAllActiveByUserId({ userId }),
				DatabaseTimeoutError,
			);
		});

		test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "find", () => {
				throw queryError;
			});

			await assert.rejects(
				async () => await repo.getAllActiveByUserId({ userId }),
				DatabaseQueryError,
			);
		});

		test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "find", () => {
				throw networkError;
			});

			await assert.rejects(
				async () => await repo.getAllActiveByUserId({ userId }),
				DatabaseNetworkError,
			);
		});

		test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "find", () => {
				throw unknownError;
			});

			await assert.rejects(
				async () => await repo.getAllActiveByUserId({ userId }),
				GenericDatabaseError,
			);
		});
	});

	describe("getAllByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const mockSessions = generateMockSelectSessions({
			count: 3,
			options: { userId: userIdObj },
		});

		test("Should return 'array of sessions' when 'db.find' is called once with 'userId'", async (t) => {
			const findMock = t.mock.method(Session, "find", () => ({
				lean: async () => mockSessions,
			}));

			const sessions = await repo.getAllByUserId({ userId });

			assert.ok(sessions);
			assert.deepStrictEqual(sessions, mockSessions);

			assert.strictEqual(findMock.mock.callCount(), 1);
			assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], { userId });
		});

		test("Should return 'empty array' when 'db.find' returns 'empty array'", async (t) => {
			t.mock.method(Session, "find", () => ({
				lean: async () => [],
			}));

			const sessions = await repo.getAllByUserId({ userId });
			assert.strictEqual(sessions.length, 0);
		});

		test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "find", () => {
				throw validationError;
			});

			await assert.rejects(
				async () => await repo.getAllByUserId({ userId }),
				DatabaseValidationError,
			);
		});

		test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "find", () => {
				throw timeoutError;
			});

			await assert.rejects(
				async () => await repo.getAllByUserId({ userId }),
				DatabaseTimeoutError,
			);
		});

		test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "find", () => {
				throw queryError;
			});

			await assert.rejects(
				async () => await repo.getAllByUserId({ userId }),
				DatabaseQueryError,
			);
		});

		test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "find", () => {
				throw networkError;
			});

			await assert.rejects(
				async () => await repo.getAllByUserId({ userId }),
				DatabaseNetworkError,
			);
		});

		test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "find", () => {
				throw unknownError;
			});

			await assert.rejects(
				async () => await repo.getAllByUserId({ userId }),
				GenericDatabaseError,
			);
		});
	});

	describe("getAllRevoked", () => {
		const mockSessions = generateMockSelectSessions({
			count: 2,
			options: { revokedAt: new Date() },
		});

		test("Should return 'array of revoked sessions' when 'db.find' is called once with 'revoked filter'", async (t) => {
			const findMock = t.mock.method(Session, "find", () => ({
				lean: async () => mockSessions,
			}));

			const sessions = await repo.getAllRevoked();

			assert.ok(sessions);
			assert.deepStrictEqual(sessions, mockSessions);

			assert.strictEqual(findMock.mock.callCount(), 1);
			assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {
				revokedAt: { $ne: null },
			});
		});

		test("Should return 'empty array' when 'db.find' returns 'empty array'", async (t) => {
			t.mock.method(Session, "find", () => ({
				lean: async () => [],
			}));

			const sessions = await repo.getAllRevoked();
			assert.strictEqual(sessions.length, 0);
		});

		test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "find", () => {
				throw validationError;
			});

			await assert.rejects(
				async () => await repo.getAllRevoked(),
				DatabaseValidationError,
			);
		});

		test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "find", () => {
				throw timeoutError;
			});

			await assert.rejects(
				async () => await repo.getAllRevoked(),
				DatabaseTimeoutError,
			);
		});

		test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "find", () => {
				throw queryError;
			});

			await assert.rejects(
				async () => await repo.getAllRevoked(),
				DatabaseQueryError,
			);
		});

		test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "find", () => {
				throw networkError;
			});

			await assert.rejects(
				async () => await repo.getAllRevoked(),
				DatabaseNetworkError,
			);
		});

		test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "find", () => {
				throw unknownError;
			});

			await assert.rejects(
				async () => await repo.getAllRevoked(),
				GenericDatabaseError,
			);
		});
	});

	describe("getAllRevokedByUserId", () => {
		const userIdObj = generateMockObjectId();
		const userId = userIdObj.toString();
		const mockSessions = generateMockSelectSessions({
			count: 2,
			options: { revokedAt: new Date(), userId: userIdObj },
		});

		test("Should return 'array of revoked sessions by user' when 'db.find' is called once with 'revoked+userId filter'", async (t) => {
			const findMock = t.mock.method(Session, "find", () => ({
				lean: async () => mockSessions,
			}));

			const sessions = await repo.getAllRevokedByUserId({ userId });

			assert.ok(sessions);
			assert.deepStrictEqual(sessions, mockSessions);

			assert.strictEqual(findMock.mock.callCount(), 1);
			const filter = findMock.mock.calls[0].arguments[0] as unknown as {
				revokedAt: { $ne: null };
				userId: string;
			};
			assert.deepStrictEqual(filter.revokedAt, { $ne: null });
			assert.strictEqual(filter.userId, userId);
		});

		test("Should return 'empty array' when 'db.find' returns 'empty array'", async (t) => {
			t.mock.method(Session, "find", () => ({
				lean: async () => [],
			}));

			const sessions = await repo.getAllRevokedByUserId({ userId });
			assert.strictEqual(sessions.length, 0);
		});

		test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "find", () => {
				throw validationError;
			});

			await assert.rejects(
				async () => await repo.getAllRevokedByUserId({ userId }),
				DatabaseValidationError,
			);
		});

		test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "find", () => {
				throw timeoutError;
			});

			await assert.rejects(
				async () => await repo.getAllRevokedByUserId({ userId }),
				DatabaseTimeoutError,
			);
		});

		test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "find", () => {
				throw queryError;
			});

			await assert.rejects(
				async () => await repo.getAllRevokedByUserId({ userId }),
				DatabaseQueryError,
			);
		});

		test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "find", () => {
				throw networkError;
			});

			await assert.rejects(
				async () => await repo.getAllRevokedByUserId({ userId }),
				DatabaseNetworkError,
			);
		});

		test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "find", () => {
				throw unknownError;
			});

			await assert.rejects(
				async () => await repo.getAllRevokedByUserId({ userId }),
				GenericDatabaseError,
			);
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
			const findOneMock = t.mock.method(Session, "findOne", () => ({
				lean: async () => mockSession,
			}));

			const session = await repo.getByTokenIdAndUserId({ tokenId, userId });

			assert.ok(session);
			assert.deepStrictEqual(session, mockSession);

			assert.strictEqual(findOneMock.mock.callCount(), 1);
			assert.deepStrictEqual(findOneMock.mock.calls[0].arguments[0], {
				tokenId,
				userId,
			});
		});

		test("Should return 'null' when 'db.findOne' returns 'null'", async (t) => {
			t.mock.method(Session, "findOne", () => ({
				lean: async () => null,
			}));

			const session = await repo.getByTokenIdAndUserId({ tokenId, userId });
			assert.strictEqual(session, null);
		});

		test("Should throw 'DatabaseValidationError' when 'db.findOne' throws 'ValidationError'", async (t) => {
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Session, "findOne", () => {
				throw validationError;
			});

			await assert.rejects(
				async () => await repo.getByTokenIdAndUserId({ tokenId, userId }),
				DatabaseValidationError,
			);
		});

		test("Should throw 'DatabaseTimeoutError' when 'db.findOne' throws 'MongoNetworkTimeoutError'", async (t) => {
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Session, "findOne", () => {
				throw timeoutError;
			});

			await assert.rejects(
				async () => await repo.getByTokenIdAndUserId({ tokenId, userId }),
				DatabaseTimeoutError,
			);
		});

		test("Should throw 'DatabaseQueryError' when 'db.findOne' throws 'MongooseError'", async (t) => {
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Session, "findOne", () => {
				throw queryError;
			});

			await assert.rejects(
				async () => await repo.getByTokenIdAndUserId({ tokenId, userId }),
				DatabaseQueryError,
			);
		});

		test("Should throw 'DatabaseNetworkError' when 'db.findOne' throws 'MongoError'", async (t) => {
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Session, "findOne", () => {
				throw networkError;
			});

			await assert.rejects(
				async () => await repo.getByTokenIdAndUserId({ tokenId, userId }),
				DatabaseNetworkError,
			);
		});

		test("Should throw 'GenericDatabaseError' when 'db.findOne' throws unknown error", async (t) => {
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Session, "findOne", () => {
				throw unknownError;
			});

			await assert.rejects(
				async () => await repo.getByTokenIdAndUserId({ tokenId, userId }),
				GenericDatabaseError,
			);
		});
	});

	describe("updateByTokenIdAndUserId", () => {});
	describe("revokeAllByUserId", () => {});
	describe("revokeByTokenIdAndUserId", () => {});
	describe("deleteAllByUserId", () => {});
	describe("deleteByTokenIdAndUserId", () => {});
	describe("countActiveByUserId", () => {});
	describe("existsByTokenIdAndUserId", () => {});
});
