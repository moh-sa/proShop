import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";

import { ValidationError } from "../../errors/index.js";
import { AuthManager } from "../../managers/auth.manager.js";
import { TokenType } from "../../types/index.js";
import {
	generateMockJwt,
	generateMockSelectSessions,
	generateMockTokenDecoded,
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
	describe("refreshAccessToken", () => {});
	describe("revokeSession", () => {});
	describe("signIn", () => {});
	describe("signOut", () => {});
	describe("signOutAll", () => {});
	describe("signUp", () => {});
});
