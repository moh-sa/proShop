import assert from "node:assert/strict";
import { beforeEach, describe, it, suite } from "node:test";

import {
	DatabaseDuplicateKeyError,
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	GenericDatabaseError,
	SessionAlreadyExistsError,
	SessionAlreadyRevokedError,
	SessionBaseError,
	SessionExpiredError,
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
			mockRepo.create.mock.mockImplementation(async () => ({
				data: expectedSession,
				success: true,
			}));

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

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new DatabaseDuplicateKeyError(),
					success: false,
				}),
			);

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

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new DatabaseQueryError(),
					success: false,
				}),
			);

			// Act
			const result = await service.create(insertData);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		it(
			"Should wrap unknown Error into SessionBaseError",
			{ skip: true, todo: "IMPLEMENT" },
			async () => {
				// Arrange
				const insertData = generateMockInsertSession();

				mockRepo.create.mock.mockImplementationOnce(() =>
					Promise.resolve({
						error: new GenericDatabaseError(),
						success: false,
					}),
				);

				// Act
				const result = await service.create(insertData);

				// Assert
				assert.strictEqual(result.success, false);
				assert.ok(result.error instanceof SessionBaseError);
			},
		);
	});

	describe("deleteAllByUserId", () => {
		it("Should return success with deleted count when repository resolves", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const expected = 3;

			mockRepo.deleteAllByUserId.mock.mockImplementation(async () => ({
				data: expected,
				success: true,
			}));

			// Act
			const result = await service.deleteAllByUserId({ userId });

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data, expected);

			assert.strictEqual(mockRepo.deleteAllByUserId.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.deleteAllByUserId.mock.calls[0].arguments[0].userId,
				userId,
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
			const userId = generateMockObjectId();

			mockRepo.deleteAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new DatabaseTimeoutError(),
					success: false,
				}),
			);

			// Act
			const result = await service.deleteAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		it(
			"Should map unknown Error into SessionBaseError",
			{ skip: true, todo: "IMPLEMENT" },
			async () => {
				// Arrange
				const userId = generateMockObjectId();
				mockRepo.deleteAllByUserId.mock.mockImplementationOnce(() =>
					Promise.resolve({
						error: new GenericDatabaseError(),
						success: false,
					}),
				);

				// Act
				const result = await service.deleteAllByUserId({ userId });

				// Assert
				assert.strictEqual(result.success, false);
				assert.ok(result.error instanceof SessionBaseError);
			},
		);
	});

	describe("getActiveByUserId", () => {
		it("Should return success with paginated active sessions when repository resolves", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const expectedSessions = generateMockSelectSessions({ count: 2 });
			const expectedPaginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 2,
				totalPages: 1,
			};

			mockRepo.getAllActiveByUserId.mock.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: expectedSessions,
						meta: expectedPaginationMeta,
					},
					success: true,
				}),
			);

			// Act
			const result = await service.getActiveByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, 2);
			assert.deepStrictEqual(result.data.items, expectedSessions);
			assert.deepStrictEqual(result.data.meta, expectedPaginationMeta);

			assert.strictEqual(mockRepo.getAllActiveByUserId.mock.callCount(), 1);

			assert.strictEqual(
				mockRepo.getAllActiveByUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
			assert.strictEqual(
				mockRepo.getAllActiveByUserId.mock.calls[0].arguments[0].pageNumber,
				1,
			);
			assert.strictEqual(
				mockRepo.getAllActiveByUserId.mock.calls[0].arguments[0].pageSize,
				10,
			);
		});

		it("Should return SessionValidationError for invalid userId", async () => {
			// Arrange
			const userId = "invalid-objectid";

			// Act
			const result = await service.getActiveByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.getAllActiveByUserId.mock.callCount(), 0);
		});

		it("Should return SessionValidationError for invalid pagination parameters", async () => {
			// Arrange
			const userId = generateMockObjectId();

			// Act
			const result = await service.getActiveByUserId({
				pageNumber: "invalid-page",
				pageSize: "invalid-size",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.getAllActiveByUserId.mock.callCount(), 0);
		});

		it("Should parse sort string and pass sort object to repository when valid", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const sessions = generateMockSelectSessions({ count: 1 });
			const paginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 1,
				totalPages: 1,
			};

			mockRepo.getAllActiveByUserId.mock.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: sessions,
						meta: paginationMeta,
					},
					success: true,
				}),
			);

			// Act
			const result = await service.getActiveByUserId({
				pageNumber: "1",
				pageSize: "10",
				sort: "createdAt:desc",
				userId,
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(mockRepo.getAllActiveByUserId.mock.callCount(), 1);

			const callArgs = mockRepo.getAllActiveByUserId.mock.calls[0].arguments[0];
			assert.deepStrictEqual(callArgs.sort, { createdAt: "desc" });
		});

		it("Should return SessionValidationError for invalid sort string", async () => {
			// Arrange
			const userId = generateMockObjectId();

			// Act
			const result = await service.getActiveByUserId({
				pageNumber: "1",
				pageSize: "10",
				sort: "not-a-valid-sort",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.getAllActiveByUserId.mock.callCount(), 0);
		});

		it("Should return success with empty paginated result when no active sessions exist", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const emptyPaginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			mockRepo.getAllActiveByUserId.mock.mockImplementation(async () => ({
				data: {
					items: [],
					meta: emptyPaginationMeta,
				},
				success: true,
			}));

			// Act
			const result = await service.getActiveByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, 0);
			assert.deepStrictEqual(result.data.items, []);
			assert.deepStrictEqual(result.data.meta, emptyPaginationMeta);

			assert.strictEqual(mockRepo.getAllActiveByUserId.mock.callCount(), 1);
		});

		it("Should pass through BaseError from repository", async () => {
			// Arrange
			const userId = generateMockObjectId();

			mockRepo.getAllActiveByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new DatabaseQueryError(),
					success: false,
				}),
			);

			// Act
			const result = await service.getActiveByUserId({
				pageNumber: "1",
				pageSize: "10",
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		it(
			"Should map unknown Error into SessionBaseError",
			{ skip: true, todo: "IMPLEMENT" },
			async () => {
				// Arrange
				const userId = generateMockObjectId();
				mockRepo.getAllActiveByUserId.mock.mockImplementationOnce(() =>
					Promise.resolve({
						error: new GenericDatabaseError(),
						success: false,
					}),
				);

				// Act
				const result = await service.getActiveByUserId({
					pageNumber: "1",
					pageSize: "10",
					userId,
				});

				// Assert
				assert.strictEqual(result.success, false);
				assert.ok(result.error instanceof SessionBaseError);
			},
		);
	});

	describe("getByTokenIdAndUserId", () => {
		it("Should return success with session when repository resolves", async () => {
			// Arrange
			const expected = generateMockSelectSession();
			const userId = expected.userId;
			const tokenId = expected.tokenId;

			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(async () => ({
				data: expected,
				success: true,
			}));

			// Act
			const result = await service.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, expected);

			assert.strictEqual(mockRepo.getByTokenIdAndUserId.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.getByTokenIdAndUserId.mock.calls[0].arguments[0].tokenId,
				tokenId,
			);
			assert.strictEqual(
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
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(async () => ({
				data: null,
				success: true,
			}));

			// Act
			const result = await service.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionNotFoundError);
		});

		it("Should pass through BaseError from repository", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.getByTokenIdAndUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new DatabaseTimeoutError(),
					success: false,
				}),
			);

			// Act
			const result = await service.getByTokenIdAndUserId({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		it(
			"Should map unknown Error into SessionBaseError",
			{ skip: true, todo: "IMPLEMENT" },
			async () => {
				// Arrange
				const userId = generateMockObjectId();
				const tokenId = "123e4567-e89b-12d3-a456-426614174000";

				mockRepo.getByTokenIdAndUserId.mock.mockImplementationOnce(() =>
					Promise.resolve({
						error: new GenericDatabaseError(),
						success: false,
					}),
				);

				// Act
				const result = await service.getByTokenIdAndUserId({ tokenId, userId });

				// Assert
				assert.strictEqual(result.success, false);
				assert.ok(result.error instanceof SessionBaseError);
			},
		);
	});

	describe("revokeAllByUserId", () => {
		it("Should return success with revoked count when repository resolves", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const expected = 5;

			mockRepo.revokeAllByUserId.mock.mockImplementation(async () => ({
				data: expected,
				success: true,
			}));

			// Act
			const result = await service.revokeAllByUserId({ userId });

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data, expected);

			assert.strictEqual(mockRepo.revokeAllByUserId.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.revokeAllByUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		it("Should return SessionValidationError for invalid userId", async () => {
			// Arrange
			const userId = "invalid-objectid";

			// Act
			const result = await service.revokeAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.revokeAllByUserId.mock.callCount(), 0);
		});

		it("Should pass through BaseError from repository", async () => {
			// Arrange
			const userId = generateMockObjectId();
			mockRepo.revokeAllByUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new GenericDatabaseError(),
					success: false,
				}),
			);

			// Act
			const result = await service.revokeAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});

		it(
			"Should map unknown Error into SessionBaseError",
			{ skip: true, todo: "IMPLEMENT" },
			async () => {
				// Arrange
				const userId = generateMockObjectId();

				mockRepo.revokeAllByUserId.mock.mockImplementationOnce(() =>
					Promise.resolve({
						error: new GenericDatabaseError(),
						success: false,
					}),
				);

				// Act
				const result = await service.revokeAllByUserId({ userId });

				// Assert
				assert.strictEqual(result.success, false);
				assert.ok(result.error instanceof SessionBaseError);
			},
		);
	});

	describe("revokeByTokenIdAndUserId", () => {
		it("Should return success with revoked session when repository resolves", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			const expected = generateMockSelectSession({ revokedAt: new Date() });

			mockRepo.revokeByTokenIdAndUserId.mock.mockImplementation(async () => ({
				data: expected,
				success: true,
			}));

			// Act
			const result = await service.revokeByTokenIdAndUserId({
				tokenId,
				userId,
			});

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(result.data, expected);

			assert.strictEqual(mockRepo.revokeByTokenIdAndUserId.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.revokeByTokenIdAndUserId.mock.calls[0].arguments[0].tokenId,
				tokenId,
			);
			assert.strictEqual(
				mockRepo.revokeByTokenIdAndUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		it("Should return SessionValidationError for invalid args", async () => {
			// Arrange
			const userId = "invalid-objectid";
			const tokenId = "invalid-uuid";

			// Act
			const result = await service.revokeByTokenIdAndUserId({
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.revokeByTokenIdAndUserId.mock.callCount(), 0);
		});

		it("Should return SessionNotFoundError when repository returns null", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.revokeByTokenIdAndUserId.mock.mockImplementation(async () => ({
				data: null,
				success: true,
			}));

			// Act
			const result = await service.revokeByTokenIdAndUserId({
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionNotFoundError);
		});

		it("Should pass through BaseError from repository", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.revokeByTokenIdAndUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new DatabaseNetworkError(),
					success: false,
				}),
			);

			// Act
			const result = await service.revokeByTokenIdAndUserId({
				tokenId,
				userId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		it(
			"Should map unknown Error into SessionBaseError",
			{ skip: true, todo: "IMPLEMENT" },
			async () => {
				// Arrange
				const userId = generateMockObjectId();
				const tokenId = "123e4567-e89b-12d3-a456-426614174000";

				mockRepo.revokeByTokenIdAndUserId.mock.mockImplementationOnce(() =>
					Promise.resolve({
						error: new GenericDatabaseError(),
						success: false,
					}),
				);

				// Act
				const result = await service.revokeByTokenIdAndUserId({
					tokenId,
					userId,
				});

				// Assert
				assert.strictEqual(result.success, false);
				assert.ok(result.error instanceof SessionBaseError);
			},
		);
	});

	describe("validate", () => {
		it("Should return success with session when not revoked and not expired", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			const expected = generateMockSelectSession({
				expiresAt: new Date(Date.now() + 60_000),
				revokedAt: null,
			});

			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(async () => ({
				data: expected,
				success: true,
			}));

			// Act
			const result = await service.validate({ tokenId, userId });

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(result.data, expected);

			assert.strictEqual(mockRepo.getByTokenIdAndUserId.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.getByTokenIdAndUserId.mock.calls[0].arguments[0].tokenId,
				tokenId,
			);
			assert.strictEqual(
				mockRepo.getByTokenIdAndUserId.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		it("Should return SessionValidationError for invalid args", async () => {
			// Arrange
			const userId = "invalid-objectid";
			const tokenId = "invalid-uuid";

			// Act
			const result = await service.validate({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionValidationError);

			assert.strictEqual(mockRepo.getByTokenIdAndUserId.mock.callCount(), 0);
		});

		it("Should return SessionNotFoundError when repository returns null", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(async () => ({
				data: null,
				success: true,
			}));

			// Act
			const result = await service.validate({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionNotFoundError);
		});

		it("Should return SessionAlreadyRevokedError when session is revoked", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			const revoked = generateMockSelectSession({ revokedAt: new Date() });
			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(async () => ({
				data: revoked,
				success: true,
			}));

			// Act
			const result = await service.validate({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionAlreadyRevokedError);
		});

		it("Should return SessionExpiredError when session is expired", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			const expired = generateMockSelectSession({
				expiresAt: new Date(Date.now() - 60_000),
				revokedAt: null,
			});
			mockRepo.getByTokenIdAndUserId.mock.mockImplementation(async () => ({
				data: expired,
				success: true,
			}));

			// Act
			const result = await service.validate({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof SessionExpiredError);
		});

		it("Should pass through BaseError from repository", async () => {
			// Arrange
			const userId = generateMockObjectId();
			const tokenId = "123e4567-e89b-12d3-a456-426614174000";

			mockRepo.getByTokenIdAndUserId.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new DatabaseQueryError(),
					success: false,
				}),
			);

			// Act
			const result = await service.validate({ tokenId, userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		it(
			"Should map unknown Error into SessionBaseError",
			{ skip: true, todo: "IMPLEMENT" },
			async () => {
				// Arrange
				const userId = generateMockObjectId();
				const tokenId = "123e4567-e89b-12d3-a456-426614174000";

				mockRepo.getByTokenIdAndUserId.mock.mockImplementation(() =>
					Promise.resolve({
						error: new GenericDatabaseError(),
						success: false,
					}),
				);

				// Act
				const result = await service.validate({ tokenId, userId });

				// Assert
				assert.strictEqual(result.success, false);
				assert.ok(result.error instanceof SessionBaseError);
			},
		);
	});
});
