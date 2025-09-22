import assert from "node:assert/strict";
import { beforeEach, describe, it, suite } from "node:test";

import {
	DatabaseDuplicateKeyError,
	DatabaseQueryError,
	SessionAlreadyExistsError,
	SessionBaseError,
	SessionValidationError,
} from "../../errors/index.js";
import { SessionService } from "../../services/index.js";
import {
	generateMockInsertSession,
	generateMockSelectSession,
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

	describe("getActiveByUserId", () => {});
	describe("getByTokenIdAndUserId", () => {});
	describe("revokeAllByUserId", () => {});
	describe("revokeByTokenIdAndUserId", () => {});
	describe("validate", () => {});
});
