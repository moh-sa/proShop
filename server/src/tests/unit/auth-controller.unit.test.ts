import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";

import { HTTP_STATUS } from "../../constants/index.js";
import { AuthController } from "../../controllers/auth.controller.js";
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

suite("Auth Controller〖 Unit Tests 〗", () => {
	const mockManager = mockAuthManager();
	const mockCookie = mockCookieService();
	const controller = new AuthController(mockManager, mockCookie as any);

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
			assert.strictEqual(accessTokenCall.item.name, "accessToken");
			assert.strictEqual(accessTokenCall.item.value, mockTokens.access.token);

			const refreshTokenCall = mockCookie.set.mock.calls[1].arguments[0];
			assert.strictEqual(refreshTokenCall.item.name, "refreshToken");
			assert.strictEqual(refreshTokenCall.item.value, mockTokens.refresh.token);
		});

		it("should configure both access and refresh tokens as httpOnly", async () => {
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
			assert.strictEqual(accessTokenCall.options.httpOnly, true);

			assert.ok(refreshTokenCall.options);
			assert.strictEqual(refreshTokenCall.options.httpOnly, true);
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
			assert.strictEqual(accessTokenCall.item.name, "accessToken");
			assert.strictEqual(accessTokenCall.item.value, mockTokens.access.token);

			const refreshTokenCall = mockCookie.set.mock.calls[1].arguments[0];
			assert.strictEqual(refreshTokenCall.item.name, "refreshToken");
			assert.strictEqual(refreshTokenCall.item.value, mockTokens.refresh.token);
		});

		it("should configure both access and refresh tokens as httpOnly", async () => {
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
			assert.strictEqual(accessTokenCall.options.httpOnly, true);

			assert.ok(refreshTokenCall.options);
			assert.strictEqual(refreshTokenCall.options.httpOnly, true);
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
			const mockRefreshToken = generateMockJwt("refresh");

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
			const mockRefreshToken = generateMockJwt("refresh");

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
			const mockRefreshToken = generateMockJwt("refresh");

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
			const mockRefreshToken = generateMockJwt("refresh");
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
			const mockRefreshToken = generateMockJwt("refresh");
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
			const mockRefreshToken = generateMockJwt("refresh");

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
			const mockRefreshToken = generateMockJwt("refresh");
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
			const mockRefreshToken = generateMockJwt("refresh");
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
			const mockRefreshToken = generateMockJwt("refresh");
			const { exp: expiresAt, token } = generateMockTokenWithData("access");

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
			const mockRefreshToken = generateMockJwt("refresh");
			const { exp: expiresAt, token } = generateMockTokenWithData("access");
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
			assert.strictEqual(accessTokenCall.item.name, "accessToken");
			assert.strictEqual(accessTokenCall.item.value, mockNewAccessToken.token);
		});

		it("should configure access token cookie as httpOnly", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const { exp: expiresAt, token } = generateMockTokenWithData("access");
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
			assert.strictEqual(accessTokenCall.options.httpOnly, true);
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
			const mockRefreshToken = generateMockJwt("refresh");
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
			const mockRefreshToken = generateMockJwt("refresh");
			const mockPaginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 3,
				totalPages: 1,
			};

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));

			mockManager.getUserSessions.mock.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: mockSessions,
						meta: mockPaginationMeta,
					},
					success: true,
				}),
			);

			// Act
			await controller.getUserSessions(req, res, next);

			// Assert
			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.OK);
		});

		it("should pass refresh token from cookie and query params to auth manager", async () => {
			// Arrange
			const mockSessions = generateMockSelectSessions({ count: 3 });
			const mockRefreshToken = generateMockJwt("refresh");
			const mockPaginationMeta = {
				currentPage: 2,
				hasNextPage: false,
				hasPreviousPage: true,
				pageSize: 20,
				totalItems: 3,
				totalPages: 1,
			};

			const { next, req, res } = createMockExpressContext();
			req.query = {
				pageNumber: "2",
				pageSize: "20",
				sort: "createdAt:-1",
			};

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.getUserSessions.mock.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: mockSessions,
						meta: mockPaginationMeta,
					},
					success: true,
				}),
			);

			// Act
			await controller.getUserSessions(req, res, next);

			// Assert
			const callArgs = mockManager.getUserSessions.mock.calls[0].arguments[0];
			assert.deepStrictEqual(callArgs, {
				pageNumber: req.query.pageNumber,
				pageSize: req.query.pageSize,
				refreshToken: mockRefreshToken,
				sort: req.query.sort,
			});
		});

		it("should pass refresh token from cookie when query params are absent", async () => {
			// Arrange
			const mockSessions = generateMockSelectSessions({ count: 3 });
			const mockRefreshToken = generateMockJwt("refresh");
			const mockPaginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 3,
				totalPages: 1,
			};

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.getUserSessions.mock.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: mockSessions,
						meta: mockPaginationMeta,
					},
					success: true,
				}),
			);

			// Act
			await controller.getUserSessions(req, res, next);

			// Assert
			const callArgs = mockManager.getUserSessions.mock.calls[0].arguments[0];
			assert.deepStrictEqual(callArgs, {
				pageNumber: req.query.pageNumber,
				pageSize: req.query.pageSize,
				refreshToken: mockRefreshToken,
				sort: req.query.sort,
			});
		});

		it("should return sessions data in response body", async () => {
			// Arrange
			const mockSessions = generateMockSelectSessions({ count: 3 });
			const mockRefreshToken = generateMockJwt("refresh");
			const mockPaginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 3,
				totalPages: 1,
			};

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.getUserSessions.mock.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: mockSessions,
						meta: mockPaginationMeta,
					},
					success: true,
				}),
			);

			// Act
			await controller.getUserSessions(req, res, next);

			// Assert
			const responseData = res._getJSONData();
			const expectedSessions = JSON.parse(JSON.stringify(mockSessions));

			assert.ok(responseData.success);
			assert.deepStrictEqual(responseData.data, expectedSessions);
			assert.deepStrictEqual(responseData.meta, mockPaginationMeta);
		});

		it("should not modify any cookies during session retrieval", async () => {
			// Arrange
			const mockSessions = generateMockSelectSessions({ count: 3 });
			const mockRefreshToken = generateMockJwt("refresh");
			const mockPaginationMeta = {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 3,
				totalPages: 1,
			};

			const { next, req, res } = createMockExpressContext();
			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.getUserSessions.mock.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: mockSessions,
						meta: mockPaginationMeta,
					},
					success: true,
				}),
			);

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
			const mockRefreshToken = generateMockJwt("refresh");
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
			const mockRefreshToken = generateMockJwt("refresh");

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
			const mockRefreshToken = generateMockJwt("refresh");

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
			const mockRefreshToken = generateMockJwt("refresh");

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
			const mockRefreshToken = generateMockJwt("refresh");
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

	describe("revokeAllSessions", () => {
		it("should revoke all user sessions", async () => {
			// Arrange
			const mockRevokedCount = 5;
			const mockRefreshToken = generateMockJwt("refresh");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.revokeAllSessions.mock.mockImplementation(async () => ({
				data: mockRevokedCount,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.revokeAllSessions(req, res, next);

			// Assert
			assert.strictEqual(mockManager.revokeAllSessions.mock.callCount(), 1);
		});

		it("should clear both access and refresh token cookies", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockRevokedCount = 5;

			const { next, req, res } = createMockExpressContext();
			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.revokeAllSessions.mock.mockImplementation(async () => ({
				data: mockRevokedCount,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.revokeAllSessions(req, res, next);

			// Assert
			const expectedCookieDeleteCount = 2;
			assert.strictEqual(
				mockCookie.delete.mock.callCount(),
				expectedCookieDeleteCount,
			);
		});

		it("should return 200 with revoked count in meta", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const mockRevokedCount = 5;

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.revokeAllSessions.mock.mockImplementation(async () => ({
				data: mockRevokedCount,
				success: true,
			}));
			mockCookie.delete.mock.mockImplementation(() => ({
				data: undefined,
				success: true,
			}));

			// Act
			await controller.revokeAllSessions(req, res, next);

			// Assert
			const responseData = res._getJSONData();
			assert.strictEqual(res._getStatusCode(), HTTP_STATUS.OK);
			assert.ok(responseData.success);
			assert.strictEqual(responseData.meta.revokedCount, mockRevokedCount);
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
				async () => await controller.revokeAllSessions(req, res, next),
				error,
			);

			assert.strictEqual(mockManager.revokeAllSessions.mock.callCount(), 0);
			assert.strictEqual(mockCookie.delete.mock.callCount(), 0);
		});

		it("should throw when manager fails and prevent cookie deletion", async () => {
			// Arrange
			const mockRefreshToken = generateMockJwt("refresh");
			const error = new Error("x");

			const { next, req, res } = createMockExpressContext();

			mockCookie.get.mock.mockImplementation(() => ({
				data: mockRefreshToken,
				success: true,
			}));
			mockManager.revokeAllSessions.mock.mockImplementation(async () => ({
				error,
				success: false,
			}));

			// Act & Assert
			await assert.rejects(
				async () => await controller.revokeAllSessions(req, res, next),
				error,
			);

			assert.strictEqual(mockCookie.delete.mock.callCount(), 0);
		});
	});
});
