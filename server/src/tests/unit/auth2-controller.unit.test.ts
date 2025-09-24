import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";
import { ZodError } from "zod";

import { CookieName, HTTP_STATUS } from "../../constants/index.js";
import { Auth2Controller } from "../../controllers/auth2.controller.js";
import { TokenType } from "../../types/index.js";
import {
	generateMockInsertUser,
	generateMockJwt,
	generateMockSelectSessions,
	generateMockSelectUser,
	generateMockTokenPairWithData,
	generateMockTokenWithData,
	mockAuthManager,
	mockCookieService,
} from "../mocks/index.js";
import { createMockExpressContext } from "../utils/index.js";

suite("Auth Controller (v2)〖 Unit Tests 〗", () => {
	const mockManager = mockAuthManager();
	const mockCookie = mockCookieService();
	const controller = new Auth2Controller(mockManager, mockCookie as any);

	beforeEach(() => {
		mockManager.reset();
		mockCookie.reset();
	});

	describe("signUp", () => {
		it("should create user and return 201 with user data", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const { password: _, ...safeUser } = generateMockSelectUser();
			const mockTokens = generateMockTokenPairWithData();
			const { next, req, res } = createMockExpressContext();
			req.body = mockInsertUser;

			mockManager.signUp.mock.mockImplementation(async () => ({
				data: {
					sessionId: "s1",
					tokens: mockTokens,
					user: safeUser,
				},
				success: true,
			}));
			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signUp(req, res, next);

			// Assert
			const responseData = res._getJSONData();
			const expectedUserData = JSON.parse(JSON.stringify(safeUser));

			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.CREATED);
			assert.ok(responseData.success);
			assert.deepStrictEqual(responseData.data.user, expectedUserData);
		});

		it("should set both access and refresh tokens as cookies", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const { password: _, ...safeUser } = generateMockSelectUser();
			const mockTokens = generateMockTokenPairWithData();
			const { next, req, res } = createMockExpressContext();
			req.body = mockInsertUser;

			mockManager.signUp.mock.mockImplementation(async () => ({
				data: {
					sessionId: "session-id",
					tokens: mockTokens,
					user: safeUser,
				},
				success: true,
			}));

			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signUp(req, res, next);

			// Assert
			const expectedCookieSetCount = 2;
			assert.strictEqual(
				mockCookie.set.mock.callCount(),
				expectedCookieSetCount,
			);

			const accessTokenCall = mockCookie.set.mock.calls[0].arguments[0];
			assert.strictEqual(accessTokenCall.item.name, CookieName.ACCESS_TOKEN);
			assert.strictEqual(accessTokenCall.item.value, mockTokens.access.token);

			const refreshTokenCall = mockCookie.set.mock.calls[1].arguments[0];
			assert.strictEqual(refreshTokenCall.item.name, CookieName.REFRESH_TOKEN);
			assert.strictEqual(refreshTokenCall.item.value, mockTokens.refresh.token);
		});

		it("should configure access token as non-httpOnly and refresh token as httpOnly", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const { password: _, ...safeUser } = generateMockSelectUser();
			const mockTokens = generateMockTokenPairWithData();
			const { next, req, res } = createMockExpressContext();
			req.body = mockInsertUser;

			mockManager.signUp.mock.mockImplementation(async () => ({
				data: {
					sessionId: "session-id",
					tokens: mockTokens,
					user: safeUser,
				},
				success: true,
			}));
			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signUp(req, res, next);

			// Assert
			const accessTokenCall = mockCookie.set.mock.calls[0].arguments[0];
			const refreshTokenCall = mockCookie.set.mock.calls[1].arguments[0];

			assert.ok(accessTokenCall.options);
			assert.strictEqual(accessTokenCall.options.httpOnly, false);

			assert.ok(refreshTokenCall.options);
			assert.strictEqual(refreshTokenCall.options.httpOnly, true);
		});

		it("should throw ZodError when required fields are missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const incompleteRequestBody = { email: "a@b.com" };
			req.body = incompleteRequestBody;

			// Act & Assert
			await assert.rejects(
				async () => await controller.signUp(req, res, next),
				ZodError,
			);

			// Ensure that the manager and cookie service were not called
			assert.strictEqual(mockManager.signUp.mock.callCount(), 0);
			assert.strictEqual(mockCookie.set.mock.callCount(), 0);
		});

		it("should throw manager error and prevent cookie setting", async () => {
			// Arrange
			const mockInsertUser = generateMockInsertUser();
			const { next, req, res } = createMockExpressContext();
			req.body = mockInsertUser;

			const error = new Error("signup failed");
			mockManager.signUp.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => await controller.signUp(req, res, next),
				error,
			);

			assert.strictEqual(mockCookie.set.mock.callCount(), 0);
		});
	});

	describe("signIn", () => {
		it("should authenticate user and return 200 with user data", async () => {
			// Arrange
			const mockTokens = generateMockTokenPairWithData();

			const mockInsertUser = generateMockInsertUser();
			const { email, password } = mockInsertUser;
			const { password: _, ...safeUser } =
				generateMockSelectUser(mockInsertUser);

			const { next, req, res } = createMockExpressContext();
			req.body = { email, password };

			mockManager.signIn.mock.mockImplementation(async () => ({
				data: {
					sessionId: "session-id",
					tokens: mockTokens,
					user: safeUser,
				},
				success: true,
			}));
			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signIn(req, res, next);

			// Assert
			const responseData = res._getJSONData();
			const expectedUserData = JSON.parse(JSON.stringify(safeUser));

			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.OK);
			assert.ok(responseData.success);
			assert.deepStrictEqual(responseData.data.user, expectedUserData);
		});

		it("should set both access and refresh tokens as cookies after signin", async () => {
			// Arrange
			const mockTokens = generateMockTokenPairWithData();

			const mockInsertUser = generateMockInsertUser();
			const { email, password } = mockInsertUser;
			const { password: _, ...safeUser } =
				generateMockSelectUser(mockInsertUser);

			const { next, req, res } = createMockExpressContext();
			req.body = { email, password };

			mockManager.signIn.mock.mockImplementation(async () => ({
				data: {
					sessionId: "session-id",
					tokens: mockTokens,
					user: safeUser,
				},
				success: true,
			}));
			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signIn(req, res, next);

			// Assert
			const expectedCookieSetCount = 2;
			assert.strictEqual(
				mockCookie.set.mock.callCount(),
				expectedCookieSetCount,
			);

			const accessTokenCall = mockCookie.set.mock.calls[0].arguments[0];
			assert.strictEqual(accessTokenCall.item.name, CookieName.ACCESS_TOKEN);
			assert.strictEqual(accessTokenCall.item.value, mockTokens.access.token);

			const refreshTokenCall = mockCookie.set.mock.calls[1].arguments[0];
			assert.strictEqual(refreshTokenCall.item.name, CookieName.REFRESH_TOKEN);
			assert.strictEqual(refreshTokenCall.item.value, mockTokens.refresh.token);
		});

		it("should configure access token as non-httpOnly and refresh token as httpOnly", async () => {
			// Arrange
			const mockTokens = generateMockTokenPairWithData();

			const mockInsertUser = generateMockInsertUser();
			const { email, password } = mockInsertUser;
			const { password: _, ...safeUser } =
				generateMockSelectUser(mockInsertUser);

			const { next, req, res } = createMockExpressContext();
			req.body = { email, password };

			mockManager.signIn.mock.mockImplementation(async () => ({
				data: {
					sessionId: "session-id",
					tokens: mockTokens,
					user: safeUser,
				},
				success: true,
			}));
			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signIn(req, res, next);

			// Assert
			const accessTokenCall = mockCookie.set.mock.calls[0].arguments[0];
			const refreshTokenCall = mockCookie.set.mock.calls[1].arguments[0];

			assert.ok(accessTokenCall.options);
			assert.strictEqual(accessTokenCall.options.httpOnly, false);

			assert.ok(refreshTokenCall.options);
			assert.strictEqual(refreshTokenCall.options.httpOnly, true);
		});

		it("should throw ZodError when email is missing", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const invalidCredentials = { email: "invalid-email" };
			req.body = invalidCredentials;

			// Act & Assert
			await assert.rejects(
				async () => await controller.signIn(req, res, next),
				ZodError,
			);
			assert.strictEqual(mockManager.signIn.mock.callCount(), 0);
		});

		it("should throw manager error and prevent cookie setting", async () => {
			// Arrange
			const { email, password } = generateMockInsertUser();

			const { next, req, res } = createMockExpressContext();
			req.body = { email, password };

			const error = new Error("signin failed");
			mockManager.signIn.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => await controller.signIn(req, res, next),
				error,
			);

			assert.strictEqual(mockCookie.set.mock.callCount(), 0);
		});
	});

	describe("signOut", () => {
		it("should read refresh cookie and sign out user", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.signOut.mock.mockImplementation(async () => ({
				data: undefined,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signOut(req, res, next);

			// Assert
			assert.strictEqual(mockCookie.get.mock.callCount(), 1);
			assert.strictEqual(mockManager.signOut.mock.callCount(), 1);
		});

		it("should clear both access and refresh token cookies", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.signOut.mock.mockImplementation(async () => ({
				data: undefined,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signOut(req, res, next);

			// Assert
			const expectedCookieDeleteCount = 2;
			assert.strictEqual(
				mockCookie.delete.mock.callCount(),
				expectedCookieDeleteCount,
			);
		});

		it("should return 200 with success message", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.signOut.mock.mockImplementation(async () => ({
				data: undefined,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signOut(req, res, next);

			// Assert
			const responseData = res._getJSONData();
			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.OK);
			assert.ok(responseData.success);
			assert.strictEqual(responseData.data.message, "Logged out successfully");
		});

		it("should throw when refresh cookie is missing/invalid", async () => {
			// Arrange
			const error = new Error("no cookie");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(
				// @ts-expect-error - test case
				() => ({ error, success: false }),
			);

			// Act & Assert
			await assert.rejects(
				async () => await controller.signOut(req, res, next),
				error,
			);

			assert.strictEqual(mockManager.signOut.mock.callCount(), 0);
			assert.strictEqual(mockCookie.delete.mock.callCount(), 0);
		});

		it("should throw when manager fails and prevent cookie deletion", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const error = new Error("fail");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.signOut.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => await controller.signOut(req, res, next),
				error,
			);
			assert.strictEqual(mockCookie.delete.mock.callCount(), 0);
		});
	});

	describe("signOutAll", () => {
		it("should sign out all sessions and return removed count", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockRemovedCount = 3;

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.signOutAll.mock.mockImplementation(async () => ({
				data: mockRemovedCount,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signOutAll(req, res, next);

			// Assert
			assert.strictEqual(mockManager.signOutAll.mock.callCount(), 1);
		});

		it("should clear both access and refresh token cookies", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.signOutAll.mock.mockImplementation(async () => ({
				data: 3,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signOutAll(req, res, next);

			// Assert
			const expectedCookieDeleteCount = 2;
			assert.strictEqual(
				mockCookie.delete.mock.callCount(),
				expectedCookieDeleteCount,
			);
		});

		it("should return 200 with removed count in meta", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const mockRemovedCount = 3;

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.signOutAll.mock.mockImplementation(async () => ({
				data: mockRemovedCount,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.signOutAll(req, res, next);

			// Assert
			const responseData = res._getJSONData();
			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.OK);
			assert.ok(responseData.success);
			assert.strictEqual(responseData.meta.removedCount, mockRemovedCount);
		});

		it("should throw when refresh cookie is missing/invalid", async () => {
			// Arrange
			const error = new Error("no cookie");

			const { next, req, res } = createMockExpressContext();
			mockCookie.get.mock.mockImplementation(
				// @ts-expect-error - test case
				() => ({ error, success: false }),
			);

			// Act & Assert
			await assert.rejects(
				async () => await controller.signOutAll(req, res, next),
				error,
			);

			assert.strictEqual(mockManager.signOutAll.mock.callCount(), 0);
			assert.strictEqual(mockCookie.delete.mock.callCount(), 0);
		});

		it("should throw when manager fails and prevent cookie deletion", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const error = new Error("Sign out all failed");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.signOutAll.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => await controller.signOutAll(req, res, next),
				error,
			);

			assert.strictEqual(mockCookie.delete.mock.callCount(), 0);
		});
	});

	describe("refreshAccessToken", () => {
		it("should refresh access token and return 200", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const { exp: expiresAt, token } = generateMockTokenWithData(
				TokenType.ACCESS,
			);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.refreshAccessToken.mock.mockImplementation(async () => ({
				data: { expiresAt: new Date(expiresAt * 1000), token },
				success: true,
			}));
			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.refreshAccessToken(req, res, next);

			// Assert
			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.OK);
		});

		it("should set only access token cookie (not refresh token)", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const { exp: expiresAt, token } = generateMockTokenWithData(
				TokenType.ACCESS,
			);
			const mockNewAccessToken = {
				expiresAt: new Date(expiresAt * 1000),
				token,
			};

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.refreshAccessToken.mock.mockImplementation(async () => ({
				data: mockNewAccessToken,
				success: true,
			}));
			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.refreshAccessToken(req, res, next);

			// Assert
			const expectedCookieSetCount = 1;
			assert.strictEqual(
				mockCookie.set.mock.callCount(),
				expectedCookieSetCount,
			);

			const accessTokenCall = mockCookie.set.mock.calls[0].arguments[0];
			assert.strictEqual(accessTokenCall.item.name, CookieName.ACCESS_TOKEN);
			assert.strictEqual(accessTokenCall.item.value, mockNewAccessToken.token);
		});

		it("should configure access token cookie as non-httpOnly", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const { exp: expiresAt, token } = generateMockTokenWithData(
				TokenType.ACCESS,
			);
			const mockNewAccessToken = {
				expiresAt: new Date(expiresAt * 1000),
				token,
			};

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.refreshAccessToken.mock.mockImplementation(async () => ({
				data: mockNewAccessToken,
				success: true,
			}));
			mockCookie.set.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.refreshAccessToken(req, res, next);

			// Assert
			const accessTokenCall = mockCookie.set.mock.calls[0].arguments[0];
			assert.ok(accessTokenCall.options);
			assert.strictEqual(accessTokenCall.options.httpOnly, false);
		});

		it("should throw when refresh cookie is missing/invalid", async () => {
			// Arrange
			const error = new Error("no cookie");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(
				// @ts-expect-error - test case
				() => ({ error, success: false }),
			);

			// Act & Assert
			await assert.rejects(
				async () => await controller.refreshAccessToken(req, res, next),
				error,
			);

			assert.strictEqual(mockManager.refreshAccessToken.mock.callCount(), 0);
			assert.strictEqual(mockCookie.set.mock.callCount(), 0);
		});

		it("should throw when manager fails and prevent cookie setting", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const error = new Error("x");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.refreshAccessToken.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => await controller.refreshAccessToken(req, res, next),
				error,
			);

			assert.strictEqual(mockCookie.set.mock.callCount(), 0);
		});
	});

	describe("getUserSessions", () => {
		it("should get user sessions and return 200", async () => {
			// Arrange
			const mockSessions = generateMockSelectSessions({ count: 3 });
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.getUserSessions.mock.mockImplementation(async () => ({
				data: mockSessions,
				success: true,
			}));

			// Act
			await controller.getUserSessions(req, res, next);

			// Assert
			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.OK);
		});

		it("should return sessions data in response body", async () => {
			// Arrange
			const mockSessions = generateMockSelectSessions({ count: 3 });
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.getUserSessions.mock.mockImplementation(async () => ({
				data: mockSessions,
				success: true,
			}));

			// Act
			await controller.getUserSessions(req, res, next);

			// Assert
			const responseData = res._getJSONData();
			const expectedSessions = JSON.parse(JSON.stringify(mockSessions));

			assert.ok(responseData.success);
			assert.deepStrictEqual(responseData.data.sessions, expectedSessions);
		});

		it("should not modify any cookies during session retrieval", async () => {
			// Arrange
			const mockSessions = generateMockSelectSessions({ count: 3 });
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();
			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.getUserSessions.mock.mockImplementation(async () => ({
				data: mockSessions,
				success: true,
			}));

			// Act
			await controller.getUserSessions(req, res, next);

			// Assert
			assert.strictEqual(mockCookie.set.mock.callCount(), 0);
			assert.strictEqual(mockCookie.delete.mock.callCount(), 0);
		});

		it("should throw when refresh cookie is missing/invalid", async () => {
			// Arrange
			const error = new Error("no cookie");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(
				// @ts-expect-error - test case
				() => ({ error, success: false }),
			);

			// Act & Assert
			await assert.rejects(
				async () => await controller.getUserSessions(req, res, next),
				error,
			);

			assert.strictEqual(mockManager.getUserSessions.mock.callCount(), 0);
		});

		it("should throw when manager fails", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const error = new Error("x");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.getUserSessions.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => await controller.getUserSessions(req, res, next),
				error,
			);
		});
	});

	describe("revokeSession", () => {
		it("should revoke current session", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.revokeSession.mock.mockImplementation(async () => ({
				data: undefined,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.revokeSession(req, res, next);

			// Assert
			assert.strictEqual(mockManager.revokeSession.mock.callCount(), 1);
		});

		it("should clear both access and refresh token cookies", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.revokeSession.mock.mockImplementation(async () => ({
				data: undefined,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.revokeSession(req, res, next);

			// Assert
			const expectedCookieDeleteCount = 2;
			assert.strictEqual(
				mockCookie.delete.mock.callCount(),
				expectedCookieDeleteCount,
			);
		});

		it("should return 200 with success message", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.revokeSession.mock.mockImplementation(async () => ({
				data: undefined,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.revokeSession(req, res, next);

			// Assert
			const responseData = res._getJSONData();
			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.OK);
			assert.ok(responseData.success);
			assert.strictEqual(
				responseData.data.message,
				"Session revoked successfully",
			);
		});

		it("should throw when refresh cookie is missing/invalid", async () => {
			// Arrange
			const error = new Error("no cookie");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(
				// @ts-expect-error - test case
				() => ({ error, success: false }),
			);

			// Act & Assert
			await assert.rejects(
				async () => await controller.revokeSession(req, res, next),
				error,
			);

			assert.strictEqual(mockManager.revokeSession.mock.callCount(), 0);
		});

		it("should throw when manager fails and prevent cookie deletion", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt(TokenType.REFRESH);
			const error = new Error("x");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.revokeSession.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => await controller.revokeSession(req, res, next),
				error,
			);

			assert.strictEqual(mockCookie.delete.mock.callCount(), 0);
		});
	});

	describe("revokeAllSessions", () => {});
});
