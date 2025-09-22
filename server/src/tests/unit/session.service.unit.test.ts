import assert from "node:assert/strict";
import { beforeEach, describe, it, suite } from "node:test";

import {
	DatabaseDuplicateKeyError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	SessionAlreadyExistsError,
	SessionBaseError,
	SessionNotFoundError,
	SessionValidationError,
} from "../../errors/index.js";
import { SessionService } from "../../services/index.js";
import {
	generateMockInsertSession,
	generateMockObjectId,
	generateMockSelectSession,
	generateMockSelectSessions,
	mockSessionRepository,
} from "../mocks/index.js";

suite("Session Service〖 Unit Tests 〗", () => {
	const mockRepo = mockSessionRepository();
	const service = new SessionService(mockRepo);

	beforeEach(() => mockRepo.reset());

	describe("create", () => {
		it("Should return success with created session when repository.create resolves", async () => {
			// Arrange
			const insertData = generateMockInsertSession();
			const expectedSession = generateMockSelectSession(insertData);
			mockRepo.create.mock.mockImplementation(async () => expectedSession);

			// Act
			const result = await service.create(insertData);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expectedSession);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				insertData,
			);
		});

		it("Should return SessionValidationError when insert args fail schema validation (invalid tokenId)", async () => {
			// Arrange
			const invalidArgs = generateMockInsertSession({
				tokenId: "invalid-uuid",
			});

			// Act
			const result = await service.create(invalidArgs);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.create.mock.callCount(), 0);
		});

		it("Should map DatabaseDuplicateKeyError to SessionAlreadyExistsError", async () => {
			// Arrange
			const insertData = generateMockInsertSession();

			mockRepo.create.mock.mockImplementation(() => {
				throw new DatabaseDuplicateKeyError();
			});

			// Act
			const result = await service.create(insertData);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionAlreadyExistsError);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
		});

		it("Should pass through BaseError from repository (e.g., DatabaseQueryError)", async () => {
			// Arrange
			const insertData = generateMockInsertSession();

			mockRepo.create.mock.mockImplementation(() => {
				throw new DatabaseQueryError();
			});

			// Act
			const result = await service.create(insertData);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		it("Should wrap unknown Error into SessionBaseError", async () => {
			// Arrange
			const insertData = generateMockInsertSession();

			mockRepo.create.mock.mockImplementation(() => {
				throw new Error("boom");
			});

			// Act
			const result = await service.create(insertData);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionBaseError);
		});
	});

	describe("deleteAllByUserId", () => {
		it("Should return success with deleted count when repository resolves", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();
			const expected = 3;

			mockRepo.deleteAllByUserId.mock.mockImplementation(async () => expected);

			// Act
			const result = await service.deleteAllByUserId({ userId });

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data, expected);

			assert.strictEqual(mockRepo.deleteAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.deleteAllByUserId.mock.calls[0].arguments[0],
				{ userId },
			);
		});

		it("Should return SessionValidationError for invalid userId", async () => {
			// Arrange
			const userId = "invalid-objectid";

			// Act
			const result = await service.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.deleteAllByUserId.mock.callCount(), 0);
		});

		it("Should pass through BaseError from repository", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();

			mockRepo.deleteAllByUserId.mock.mockImplementation(() => {
				throw new DatabaseTimeoutError();
			});

			// Act
			const result = await service.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		it("Should map unknown Error into SessionBaseError", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();
			mockRepo.deleteAllByUserId.mock.mockImplementation(() => {
				throw new Error();
			});

			// Act
			const result = await service.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionBaseError);
		});
	});

	describe("getActiveByUserId", () => {
		it("Should return success with active sessions when repository resolves", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();
			const expected = generateMockSelectSessions({ count: 2 });

			mockRepo.getAllActiveByUserId.mock.mockImplementation(
				async () => expected,
			);

			// Act
			const result = await service.getActiveByUserId({ userId });

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(result.data, expected);

			assert.strictEqual(mockRepo.getAllActiveByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getAllActiveByUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		it("Should return SessionValidationError for invalid userId", async () => {
			// Arrange
			const userId = "invalid-objectid";

			// Act
			const result = await service.getActiveByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.getAllActiveByUserId.mock.callCount(), 0);
		});

		it("Should pass through BaseError from repository", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();

			mockRepo.getAllActiveByUserId.mock.mockImplementation(() => {
				throw new DatabaseQueryError("query");
			});

			// Act
			const result = await service.getActiveByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		it("Should wrap unknown Error into SessionBaseError", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();
			mockRepo.getAllActiveByUserId.mock.mockImplementation(() => {
				throw new Error();
			});

			// Act
			const result = await service.getActiveByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionBaseError);
		});
	});

	describe("getByTokenIdAndUserId", () => {
		it("Should return success with session when repository resolves", async () => {
			// Arrange
			const expected = generateMockSelectSession();
			const userId = expected.userId.toString();
			const tokenId = expected.tokenId;

			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(
				async () => expected,
			);

			// Act
			const result = await service.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expected);

			assert.strictEqual(mockRepo.getByTokenIdAndUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getByTokenIdAndUserId.mock.calls[0].arguments[0].tokenId,
				tokenId,
			);
			assert.deepStrictEqual(
				mockRepo.getByTokenIdAndUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		it("Should return SessionValidationError for invalid args", async () => {
			// Arrange
			const userId = "invalid-objectid";
			const tokenId = "invalid-uuid";

			// Act
			const result = await service.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.getByTokenIdAndUserId.mock.callCount(), 0);
		});

		it("Should return SessionNotFoundError when repository returns null", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(async () => null);

			// Act
			const result = await service.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionNotFoundError);
		});

		it("Should pass through BaseError from repository", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(() => {
				throw new DatabaseTimeoutError("timeout");
			});

			// Act
			const result = await service.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		it("Should wrap unknown Error into SessionBaseError", async () => {
			// Arrange
			const userId = generateMockObjectId().toString();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(() => {
				throw new Error();
			});

			// Act
			const result = await service.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionBaseError);
		});
	});

	describe("revokeAllByUserId", () => {});
	describe("revokeByTokenIdAndUserId", () => {});
	describe("validate", () => {});
});
