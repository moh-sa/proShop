import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";

import { DEMO_ACCOUNT_EMAILS } from "../../constants/index.js";
import {
	ConflictError,
	InvalidCredentialsError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import { AuthManager } from "../../managers/auth.manager.js";
import type { TokenResult } from "../../types/index.js";
import {
	generateMockInsertUser,
	generateMockJwt,
	generateMockSelectSession,
	generateMockSelectSessions,
	generateMockSelectUser,
	generateMockTokenDecoded,
	generateMockTokenPairWithData,
	generateMockTokenWithData,
	mockJwtService,
	mockPasswordService,
	mockSessionService,
	mockUserService,
} from "../mocks/index.js";

suite("Auth Manager 〖 Unit Tests 〗", () => {
	const mockJwt = mockJwtService();
	const mockPassword = mockPasswordService();
	const mockSession = mockSessionService();
	const mockUser = mockUserService();
	const manager = new AuthManager(mockJwt, mockPassword, mockSession, mockUser);

	beforeEach(() => {
		mockJwt.reset();
		mockPassword.reset();
		mockSession.reset();
		mockUser.reset();
	});

	describe("getUserSessions", () => {
		it("should return success with paginated active sessions when refreshToken is valid and session service resolves", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");
			const mockSessions = generateMockSelectSessions({ count: 2 });
			const mockPaginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 2,
				totalPages: 1,
			};

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));

			mockSession.getActiveByUserId.mock.mockImplementation(async () => ({
				data: {
					items: mockSessions,
					meta: mockPaginationMeta,
				},
				success: true,
			}));

			// Act
			const result = await manager.getUserSessions({
				pageNumber: "1",
				pageSize: "10",
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, 2);
			assert.deepStrictEqual(result.data.items, mockSessions);
			assert.deepStrictEqual(result.data.meta, mockPaginationMeta);

			assert.strictEqual(mockJwt.verify.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockJwt.verify.mock.calls[0].arguments[0].expectedType,
				"refresh",
			);
			assert.deepStrictEqual(
				mockJwt.verify.mock.calls[0].arguments[0].token,
				mockRefreshToken,
			);
		});

		it("should return ValidationError when refreshToken is missing", async () => {
			// Arrange
			const emptyRefreshToken = "";

			// Act
			const result = await manager.getUserSessions({
				pageNumber: "1",
				pageSize: "10",
				refreshToken: emptyRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockJwt.verify.mock.callCount(), 0);
		});

		it("should bubble JWT verify failure", async () => {
			// Arrange
			const invalidToken = "invalid-jwt";
			const jwtError = new ValidationError("invalid jwt");

			mockJwt.verify.mock.mockImplementation(() => ({
				error: jwtError,
				success: false,
			}));

			// Act
			const result = await manager.getUserSessions({
				pageNumber: "1",
				pageSize: "10",
				refreshToken: invalidToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, jwtError);

			assert.strictEqual(mockSession.getActiveByUserId.mock.callCount(), 0);
		});

		it("should bubble session service error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");
			const error = new ValidationError("svc");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.getActiveByUserId.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.getUserSessions({
				pageNumber: "1",
				pageSize: "10",
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		it("should return success with empty paginated results when no active sessions exist", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");
			const emptyPaginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 0,
				totalPages: 0,
			};

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.getActiveByUserId.mock.mockImplementation(async () => ({
				data: {
					items: [],
					meta: emptyPaginationMeta,
				},
				success: true,
			}));

			// Act
			const result = await manager.getUserSessions({
				pageNumber: "1",
				pageSize: "10",
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(Array.isArray(result.data.items), true);
			assert.strictEqual(result.data.items.length, 0);
			assert.deepStrictEqual(result.data.items, []);
			assert.deepStrictEqual(result.data.meta, emptyPaginationMeta);

			assert.strictEqual(mockSession.getActiveByUserId.mock.callCount(), 1);
		});

		it("should forward manager args and JWT userId to session service", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");
			const mockSessions = generateMockSelectSessions({ count: 1 });
			const mockPaginationMeta = {
				currentPage: 2,
				hasNextPage: true,
				hasPreviousPage: true,
				pageSize: 5,
				totalItems: 12,
				totalPages: 3,
			};

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.getActiveByUserId.mock.mockImplementation(async () => ({
				data: {
					items: mockSessions,
					meta: mockPaginationMeta,
				},
				success: true,
			}));

			// Act
			const result = await manager.getUserSessions({
				pageNumber: "2",
				pageSize: "5",
				refreshToken: mockRefreshToken,
				sort: "createdAt:desc",
			});

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(mockSession.getActiveByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockSession.getActiveByUserId.mock.calls[0].arguments[0],
				{
					pageNumber: "2",
					pageSize: "5",
					refreshToken: mockRefreshToken,
					sort: "createdAt:desc",
					userId: mockDecodedToken.userId,
				},
			);
		});
	});

	describe("refreshAccessToken", () => {
		it("should return success with new access token when refresh token and session are valid", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			const mockAccessData = generateMockTokenWithData("access");
			const access: TokenResult = {
				expiresAt: new Date(mockAccessData.exp * 1000),
				token: mockAccessData.token,
				tokenId: mockAccessData.tokenId,
			};

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.validate.mock.mockImplementation(async () => ({
				data: generateMockSelectSession(),
				success: true,
			}));
			mockJwt.generateAccessToken.mock.mockImplementation(() => ({
				data: access,
				success: true,
			}));

			// Act
			const result = await manager.refreshAccessToken({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.token, access.token);
			assert.strictEqual(result.data.expiresAt, access.expiresAt);

			assert.strictEqual(mockSession.validate.mock.callCount(), 1);
			assert.strictEqual(
				mockSession.validate.mock.calls[0].arguments[0].tokenId,
				mockDecodedToken.tokenId,
			);
			assert.strictEqual(
				mockSession.validate.mock.calls[0].arguments[0].userId,
				mockDecodedToken.userId,
			);

			assert.strictEqual(mockJwt.verify.mock.callCount(), 1);
			assert.strictEqual(mockJwt.generateAccessToken.mock.callCount(), 1);
			assert.strictEqual(
				mockJwt.generateAccessToken.mock.calls[0].arguments[0].userId,
				mockDecodedToken.userId,
			);
		});

		it("should return ValidationError when refreshToken is missing", async () => {
			// Arrange
			const emptyRefreshToken = "";

			// Act
			const result = await manager.refreshAccessToken({
				refreshToken: emptyRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			assert.strictEqual(mockJwt.verify.mock.callCount(), 0);
		});

		it("should bubble jwt.verify error", async () => {
			// Arrange
			const invalidToken = "invalid-jwt";
			const error = new ValidationError("Invalid token");

			mockJwt.verify.mock.mockImplementation(() => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.refreshAccessToken({
				refreshToken: invalidToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		it("should bubble session.validate error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			const error = new ValidationError("session");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.validate.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.refreshAccessToken({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		it("should bubble access token generation error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			const error = new ValidationError("gen");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.validate.mock.mockImplementation(async () => ({
				data: generateMockSelectSession(),
				success: true,
			}));
			mockJwt.generateAccessToken.mock.mockImplementation(() => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.refreshAccessToken({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});
	});

	describe("revokeAllSessions", () => {
		it("should return success with count when refresh token valid and revokeAllByUserId resolves", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.revokeAllByUserId.mock.mockImplementation(async () => ({
				data: 3,
				success: true,
			}));

			// Act
			const result = await manager.revokeAllSessions({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, 3);

			assert.strictEqual(mockSession.revokeAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockSession.revokeAllByUserId.mock.calls[0].arguments[0].userId,
				mockDecodedToken.userId,
			);
		});

		it("should return ValidationError when refresh token is missing", async () => {
			// Arrange
			const emptyRefreshToken = "";

			// Act
			const result = await manager.revokeAllSessions({
				refreshToken: emptyRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should bubble jwt.verify error", async () => {
			// Arrange
			const invalidRefreshToken = "invalid-jwt";
			const error = new ValidationError("jwt");

			mockJwt.verify.mock.mockImplementation(() => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.revokeAllSessions({
				refreshToken: invalidRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		it("should bubble session.revokeAllByUserId error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			const error = new ValidationError("svc");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.revokeAllByUserId.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.revokeAllSessions({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});
	});

	describe("revokeSession", () => {
		it("should return success when refresh token valid and revokeByTokenIdAndUserId resolves", async () => {
			// Arrange
			const mockSelectSession = generateMockSelectSession();
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.revokeByTokenIdAndUserId.mock.mockImplementation(
				async () => ({ data: mockSelectSession, success: true }),
			);

			// Act
			const result = await manager.revokeSession({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(
				mockSession.revokeByTokenIdAndUserId.mock.callCount(),
				1,
			);
			assert.deepStrictEqual(
				mockSession.revokeByTokenIdAndUserId.mock.calls[0].arguments[0].tokenId,
				mockDecodedToken.tokenId,
			);
			assert.deepStrictEqual(
				mockSession.revokeByTokenIdAndUserId.mock.calls[0].arguments[0].userId,
				mockDecodedToken.userId,
			);
		});

		it("should return ValidationError when refresh token is missing", async () => {
			// Arrange
			const emptyRefreshToken = "";

			// Act
			const result = await manager.revokeSession({
				refreshToken: emptyRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should bubble jwt.verify error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const error = new ValidationError("jwt");

			mockJwt.verify.mock.mockImplementation(() => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.revokeSession({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		it("should bubble session.revokeByTokenIdAndUserId error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			const error = new ValidationError("svc");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.revokeByTokenIdAndUserId.mock.mockImplementation(
				async () => ({ error, success: false }),
			);

			// Act
			const result = await manager.revokeSession({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});
	});

	describe("signIn", () => {
		it("should return ValidationError when email is missing", async () => {
			// Arrange
			const mockUserEmptyEmail = generateMockInsertUser({ email: "" });
			// Act
			const result = await manager.signIn(mockUserEmptyEmail);
			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should return ValidationError when password is missing", async () => {
			// Arrange
			const mockUserEmptyPassword = generateMockInsertUser({ password: "" });
			// Act
			const result = await manager.signIn(mockUserEmptyPassword);
			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should return InvalidCredentialsError when user is not found by email", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();

			mockUser.getByEmail_UNSAFE.mock.mockImplementation(
				// @ts-expect-error - mock implementation
				() => Promise.resolve({ success: false }),
			);

			// Act
			const result = await manager.signIn({
				email: mockInsertUser.email,
				password: mockInsertUser.password,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof InvalidCredentialsError);

			assert.strictEqual(mockPassword.verify.mock.callCount(), 0);
		});

		it("should return InvalidCredentialsError when password verification fails", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const mockSelectUser = generateMockSelectUser(mockInsertUser);
			const error = new ValidationError("invalid-password");

			mockUser.getByEmail_UNSAFE.mock.mockImplementation(() =>
				Promise.resolve({ data: mockSelectUser, success: true }),
			);
			mockPassword.verify.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.signIn({
				email: mockInsertUser.email,
				password: mockInsertUser.password,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof InvalidCredentialsError);
		});

		it("should return success with tokens, sessionId and sanitized user when credentials are valid", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const mockSelectUser = generateMockSelectUser(mockInsertUser);
			const mockTokenPair = generateMockTokenPairWithData();

			const session = generateMockSelectSession({
				expiresAt: mockTokenPair.refresh.expiresAt,
				tokenId: mockTokenPair.refresh.tokenId,
				userId: mockSelectUser.id,
			});

			mockUser.getByEmail_UNSAFE.mock.mockImplementation(async () => ({
				data: mockSelectUser,
				success: true,
			}));

			mockPassword.verify.mock.mockImplementation(async () => ({
				data: undefined,
				success: true,
			}));

			mockUser.sanitizeUser.mock.mockImplementationOnce(() => ({
				data: mockSelectUser,
				success: true,
			}));

			mockJwt.generateTokenPair.mock.mockImplementation(() => ({
				data: mockTokenPair,
				success: true,
			}));

			mockSession.create.mock.mockImplementation(async () => ({
				data: session,
				success: true,
			}));

			// Act
			const result = await manager.signIn({
				email: mockInsertUser.email,
				password: mockInsertUser.password,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.sessionId, session.id);
			assert.deepStrictEqual(result.data.tokens, mockTokenPair);
			assert.deepStrictEqual(result.data.user, mockSelectUser);

			assert.strictEqual(mockJwt.generateTokenPair.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockJwt.generateTokenPair.mock.calls[0].arguments[0].userId,
				mockSelectUser.id,
			);

			assert.strictEqual(mockSession.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockSession.create.mock.calls[0].arguments[0].tokenId,
				mockTokenPair.refresh.tokenId,
			);
			assert.deepStrictEqual(
				mockSession.create.mock.calls[0].arguments[0].userId,
				mockSelectUser.id,
			);
		});
	});

	describe("signInDemo", () => {
		it("should sign in admin demo account without verifying a password", async () => {
			// Arrange
			const mockSelectUser = generateMockSelectUser({
				email: DEMO_ACCOUNT_EMAILS.admin,
				isAdmin: true,
			});
			const mockTokenPair = generateMockTokenPairWithData();
			const session = generateMockSelectSession({
				expiresAt: mockTokenPair.refresh.expiresAt,
				tokenId: mockTokenPair.refresh.tokenId,
				userId: mockSelectUser.id,
			});

			mockUser.getByEmail_UNSAFE.mock.mockImplementation(async () => ({
				data: mockSelectUser,
				success: true,
			}));
			mockUser.sanitizeUser.mock.mockImplementationOnce(() => ({
				data: mockSelectUser,
				success: true,
			}));
			mockJwt.generateTokenPair.mock.mockImplementation(() => ({
				data: mockTokenPair,
				success: true,
			}));
			mockSession.create.mock.mockImplementation(async () => ({
				data: session,
				success: true,
			}));

			// Act
			const result = await manager.signInDemo({ role: "admin" });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.sessionId, session.id);
			assert.deepStrictEqual(result.data.tokens, mockTokenPair);
			assert.deepStrictEqual(result.data.user, mockSelectUser);

			assert.strictEqual(mockPassword.verify.mock.callCount(), 0);
			assert.deepStrictEqual(
				mockUser.getByEmail_UNSAFE.mock.calls[0].arguments[0],
				{ email: DEMO_ACCOUNT_EMAILS.admin },
			);
		});

		it("should map customer demo role to the customer demo email", async () => {
			// Arrange
			const mockSelectUser = generateMockSelectUser({
				email: DEMO_ACCOUNT_EMAILS.customer,
				isAdmin: false,
			});
			const mockTokenPair = generateMockTokenPairWithData();
			const session = generateMockSelectSession({
				expiresAt: mockTokenPair.refresh.expiresAt,
				tokenId: mockTokenPair.refresh.tokenId,
				userId: mockSelectUser.id,
			});

			mockUser.getByEmail_UNSAFE.mock.mockImplementation(async () => ({
				data: mockSelectUser,
				success: true,
			}));
			mockUser.sanitizeUser.mock.mockImplementationOnce(() => ({
				data: mockSelectUser,
				success: true,
			}));
			mockJwt.generateTokenPair.mock.mockImplementation(() => ({
				data: mockTokenPair,
				success: true,
			}));
			mockSession.create.mock.mockImplementation(async () => ({
				data: session,
				success: true,
			}));

			// Act
			const result = await manager.signInDemo({ role: "customer" });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(
				mockUser.getByEmail_UNSAFE.mock.calls[0].arguments[0],
				{ email: DEMO_ACCOUNT_EMAILS.customer },
			);
		});

		it("should return InvalidCredentialsError when demo user is unavailable", async () => {
			// Arrange
			mockUser.getByEmail_UNSAFE.mock.mockImplementation(async () => ({
				error: new NotFoundError("User"),
				success: false,
			}));

			// Act
			const result = await manager.signInDemo({ role: "admin" });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof InvalidCredentialsError);
			assert.strictEqual(mockPassword.verify.mock.callCount(), 0);
			assert.strictEqual(mockSession.create.mock.callCount(), 0);
		});
	});

	describe("signOut", () => {
		it("should return success when deleteByTokenIdAndUserId resolves", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));

			mockSession.deleteByTokenIdAndUserId.mock.mockImplementation(
				async () => ({ data: generateMockSelectSession(), success: true }),
			);

			// Act
			const result = await manager.signOut({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(
				mockSession.deleteByTokenIdAndUserId.mock.callCount(),
				1,
			);
			assert.deepStrictEqual(
				mockSession.deleteByTokenIdAndUserId.mock.calls[0].arguments[0].tokenId,
				mockDecodedToken.tokenId,
			);
			assert.deepStrictEqual(
				mockSession.deleteByTokenIdAndUserId.mock.calls[0].arguments[0].userId,
				mockDecodedToken.userId,
			);
		});

		it("should return ValidationError when refresh token is missing", async () => {
			// Arrange
			const emptyRefreshToken = "";

			// Act
			const result = await manager.signOut({
				refreshToken: emptyRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should bubble jwt.verify error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");

			const error = new ValidationError("jwt");

			mockJwt.verify.mock.mockImplementation(() => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.signOut({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		it("should bubble session.deleteByTokenIdAndUserId error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			const error = new ValidationError("svc");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.deleteByTokenIdAndUserId.mock.mockImplementation(
				async () => ({ error, success: false }),
			);

			// Act
			const result = await manager.signOut({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});
	});

	describe("signOutAll", () => {
		it("should return success with deleted count when deleteAllByUserId resolves", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");
			const expectedDeletedSessions = 5;

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));

			mockSession.deleteAllByUserId.mock.mockImplementation(async () => ({
				data: expectedDeletedSessions,
				success: true,
			}));

			// Act
			const result = await manager.signOutAll({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data, expectedDeletedSessions);

			assert.strictEqual(mockSession.deleteAllByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockSession.deleteAllByUserId.mock.calls[0].arguments[0].userId,
				mockDecodedToken.userId,
			);
		});

		it("should return ValidationError when refresh token is missing", async () => {
			// Arrange
			const emptyRefreshToken = "";

			// Act
			const result = await manager.signOutAll({
				refreshToken: emptyRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should bubble jwt.verify error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");

			const error = new ValidationError("jwt");

			mockJwt.verify.mock.mockImplementation(() => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.signOutAll({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		it("should bubble session.deleteAllByUserId error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockDecodedToken = generateMockTokenDecoded("refresh");

			const error = new ValidationError("svc");

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.deleteAllByUserId.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act
			const result = await manager.signOutAll({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});
	});

	describe("signUp", () => {
		it("should return ValidationError when email is missing", async () => {
			// Arrange
			const mockUserEmptyEmail = generateMockInsertUser({ email: "" });
			// Act
			const result = await manager.signUp(mockUserEmptyEmail);
			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should return ValidationError when password is missing", async () => {
			// Arrange
			const mockUserEmptyPassword = generateMockInsertUser({ password: "" });
			// Act
			const result = await manager.signUp(mockUserEmptyPassword);
			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should return ValidationError when name is missing", async () => {
			// Arrange
			const mockUserEmptyName = generateMockInsertUser({ name: "" });
			// Act
			const result = await manager.signUp(mockUserEmptyName);
			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		it("should return ConflictError when user already exists by email", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const mockSelectUser = generateMockSelectUser(mockInsertUser);

			mockUser.existsByEmail.mock.mockImplementation(() =>
				Promise.resolve({
					data: mockSelectUser,
					success: true,
				}),
			);

			// Act
			const result = await manager.signUp(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ConflictError);

			assert.strictEqual(mockPassword.hash.mock.callCount(), 0);
		});

		it("should continue sign-up when existsByEmail returns NotFoundError", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const mockSelectUser = generateMockSelectUser(mockInsertUser);
			const mockTokenPair = generateMockTokenPairWithData();

			const session = generateMockSelectSession({
				expiresAt: mockTokenPair.refresh.expiresAt,
				tokenId: mockTokenPair.refresh.tokenId,
				userId: mockSelectUser.id,
			});

			mockUser.existsByEmail.mock.mockImplementation(() =>
				Promise.resolve({
					error: new NotFoundError("User"),
					success: false,
				}),
			);
			mockUser.create.mock.mockImplementation(() =>
				Promise.resolve({
					data: mockSelectUser,
					success: true,
				}),
			);

			mockPassword.hash.mock.mockImplementation(() =>
				Promise.resolve({
					data: mockInsertUser.password,
					success: true,
				}),
			);

			mockJwt.generateTokenPair.mock.mockImplementation(() => ({
				data: mockTokenPair,
				success: true,
			}));

			mockSession.create.mock.mockImplementation(() =>
				Promise.resolve({
					data: session,
					success: true,
				}),
			);

			// Act
			const result = await manager.signUp(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.sessionId, session.id);
			assert.deepStrictEqual(result.data.tokens, mockTokenPair);
			assert.deepStrictEqual(result.data.user, mockSelectUser);

			assert.strictEqual(mockPassword.hash.mock.callCount(), 1);
		});

		it("should bubble existsByEmail error when it is not NotFoundError", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const error = new ValidationError("database error");

			mockUser.existsByEmail.mock.mockImplementation(() =>
				Promise.resolve({
					error,
					success: false,
				}),
			);

			// Act
			const result = await manager.signUp(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);

			assert.strictEqual(mockPassword.hash.mock.callCount(), 0);
		});

		it("should bubble password.hash error", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const error = new ValidationError("hash");

			mockUser.existsByEmail.mock.mockImplementation(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);
			mockPassword.hash.mock.mockImplementation(() =>
				Promise.resolve({
					error,
					success: false,
				}),
			);

			// Act
			const result = await manager.signUp(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});

		it("should return success with tokens, session and user when created successfully", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const mockSelectUser = generateMockSelectUser(mockInsertUser);
			const mockTokenPair = generateMockTokenPairWithData();

			const session = generateMockSelectSession({
				expiresAt: mockTokenPair.refresh.expiresAt,
				tokenId: mockTokenPair.refresh.tokenId,
				userId: mockSelectUser.id,
			});

			mockUser.existsByEmail.mock.mockImplementation(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);
			mockUser.create.mock.mockImplementation(() =>
				Promise.resolve({
					data: mockSelectUser,
					success: true,
				}),
			);

			mockPassword.hash.mock.mockImplementation(() =>
				Promise.resolve({
					data: mockInsertUser.password,
					success: true,
				}),
			);

			mockJwt.generateTokenPair.mock.mockImplementation(() => ({
				data: mockTokenPair,
				success: true,
			}));

			mockSession.create.mock.mockImplementation(() =>
				Promise.resolve({
					data: session,
					success: true,
				}),
			);

			// Act
			const result = await manager.signUp(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.sessionId, session.id);
			assert.deepStrictEqual(result.data.tokens, mockTokenPair);
			assert.deepStrictEqual(result.data.user, mockSelectUser);

			assert.strictEqual(mockUser.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockUser.create.mock.calls[0].arguments[0],
				mockInsertUser,
			);

			assert.strictEqual(mockJwt.generateTokenPair.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockJwt.generateTokenPair.mock.calls[0].arguments[0].userId,
				mockSelectUser.id,
			);

			assert.strictEqual(mockSession.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockSession.create.mock.calls[0].arguments[0].tokenId,
				mockTokenPair.refresh.tokenId,
			);
		});

		it("should bubble user.create error", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const error = new ValidationError("user creation failed");

			mockUser.existsByEmail.mock.mockImplementation(() =>
				Promise.resolve({
					data: null,
					success: true,
				}),
			);

			mockPassword.hash.mock.mockImplementation(() =>
				Promise.resolve({
					data: mockInsertUser.password,
					success: true,
				}),
			);

			mockUser.create.mock.mockImplementation(() =>
				Promise.resolve({
					error,
					success: false,
				}),
			);

			// Act
			const result = await manager.signUp(mockInsertUser);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});
	});
});
