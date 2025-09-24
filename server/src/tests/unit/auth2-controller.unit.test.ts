import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";
import { ZodError } from "zod";

import { CookieName, HTTP_STATUS } from "../../constants/index.js";
import { Auth2Controller } from "../../controllers/auth2.controller.js";
import {
	generateMockInsertUser,
	generateMockSelectUser,
	generateMockTokenPairWithData,
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

	describe("signIn", () => {});
	describe("signOut", () => {});
	describe("signOutAll", () => {});
	describe("refreshAccessToken", () => {});
	describe("getUserSessions", () => {});
	describe("revokeSession", () => {});
	describe("revokeAllSessions", () => {});
});
