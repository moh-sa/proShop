import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";

import type { TokenResult } from "../../types/index.js";

import {
	InvalidCredentialsError,
	ValidationError,
} from "../../errors/index.js";
import { AuthManager } from "../../managers/auth.manager.js";
import { TokenType } from "../../types/index.js";
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
		it("should return success with active sessions when refreshToken is valid and session service resolves", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);
			const mockSessions = generateMockSelectSessions({ count: 2 });

			mockJwt.verify.mock.mockImplementation(() => ({
				data: mockDecodedToken,
				success: true,
			}));
			mockSession.getActiveByUserId.mock.mockImplementation(async () => ({
				data: mockSessions,
				success: true,
			}));

			// Act
			const result = await manager.getUserSessions({
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockSessions);

			assert.strictEqual(mockJwt.verify.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockJwt.verify.mock.calls[0].arguments[0].expectedType,
				TokenType.REFRESH,
			);
			assert.deepStrictEqual(
				mockJwt.verify.mock.calls[0].arguments[0].token,
				mockRefreshToken,
			);

			assert.strictEqual(mockSession.getActiveByUserId.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockSession.getActiveByUserId.mock.calls[0].arguments[0].userId,
				mockDecodedToken.userId,
			);
		});

		it("should return ValidationError when refreshToken is missing", async () => {
			// Arrange
			const emptyRefreshToken = "";

			// Act
			const result = await manager.getUserSessions({
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
				refreshToken: invalidToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, jwtError);

			assert.strictEqual(mockSession.getActiveByUserId.mock.callCount(), 0);
		});

		it("should bubble session service error", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);
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
				refreshToken: mockRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, error);
		});
	});

	describe("refreshAccessToken", () => {
		it("should return success with new access token when refresh token and session are valid", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

			const mockAccessData = generateMockTokenWithData(TokenType.ACCESS);
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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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
				async () => null,
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

			mockUser.getByEmail_UNSAFE.mock.mockImplementation(
				async () => mockSelectUser,
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
				userId: mockSelectUser._id,
			});

			mockUser.getByEmail_UNSAFE.mock.mockImplementation(
				async () => mockSelectUser,
			);

			mockPassword.verify.mock.mockImplementation(async () => ({
				data: undefined,
				success: true,
			}));

			mockUser.sanitizeUser.mock.mockImplementationOnce(() => mockSelectUser);

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
			assert.strictEqual(result.data.sessionId, session.id.toString());
			assert.deepStrictEqual(result.data.tokens, mockTokenPair);
			assert.deepStrictEqual(result.data.user, mockSelectUser);

			assert.strictEqual(mockJwt.generateTokenPair.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockJwt.generateTokenPair.mock.calls[0].arguments[0].userId,
				mockSelectUser._id.toString(),
			);

			assert.strictEqual(mockSession.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockSession.create.mock.calls[0].arguments[0].tokenId,
				mockTokenPair.refresh.tokenId,
			);
			assert.deepStrictEqual(
				mockSession.create.mock.calls[0].arguments[0].userId,
				mockSelectUser._id,
			);
		});
	});

	describe("signOut", () => {
		it("should return success when deleteByTokenIdAndUserId resolves", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);
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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

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
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockDecodedToken = generateMockTokenDecoded(TokenType.REFRESH);

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

	describe("signUp", () => {});
});
