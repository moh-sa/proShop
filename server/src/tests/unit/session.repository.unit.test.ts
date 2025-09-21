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
import { generateMockInsertSession } from "../mocks/index.js";

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
	describe("getAll", () => {});
	describe("getAllActiveByUserId", () => {});
	describe("getAllByUserId", () => {});
	describe("getAllRevoked", () => {});
	describe("getAllRevokedByUserId", () => {});
	describe("getByTokenIdAndUserId", () => {});
	describe("updateByTokenIdAndUserId", () => {});
	describe("revokeAllByUserId", () => {});
	describe("revokeByTokenIdAndUserId", () => {});
	describe("deleteAllByUserId", () => {});
	describe("deleteByTokenIdAndUserId", () => {});
	describe("countActiveByUserId", () => {});
	describe("existsByTokenIdAndUserId", () => {});
});
