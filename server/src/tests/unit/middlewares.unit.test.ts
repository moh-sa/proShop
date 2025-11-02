import type { TestContext } from "node:test";

import assert from "node:assert";
import test, { describe, suite } from "node:test";

import type { TokenType } from "../../types/index.js";

import { CookieName } from "../../constants/cookie.constants.js";
import { AuthenticationError } from "../../errors/index.js";
import { authenticate } from "../../middlewares/index.js";
import {
	CookieService,
	JwtService,
	SessionService,
} from "../../services/index.js";
import { mockExpressCall } from "../mocks/index.js";

suite("Middlewares 〖 Unit Tests 〗", () => {
	describe("authenticate", () => {
		function setupMockGetCookie(
			t: TestContext,
			refreshToken?: string,
			accessToken?: string,
		) {
			return t.mock.method(
				CookieService.prototype,
				"get",
				({ name }: { name: CookieName }) => {
					return name === CookieName.REFRESH_TOKEN
						? {
								data: refreshToken ? refreshToken : "refreshTokenString",
								success: true,
							}
						: {
								data: accessToken ? accessToken : "accessTokenString",
								success: true,
							};
				},
			);
		}

		function setupMockVerifyJwt(t: TestContext, tokenId?: string) {
			return t.mock.method(
				JwtService.prototype,
				"verify",
				(args: { expectedType: TokenType; token: string }) => ({
					data: {
						exp: 2,
						iat: 1,
						tokenId: tokenId ? tokenId : "tokenId",
						type: args.expectedType,
						userId: "507f1f77bcf86cd799439011",
					},
					success: true,
				}),
			);
		}

		function setupMockValidateSession(
			t: TestContext,
			userId?: string,
			tokenId?: string,
		) {
			const now = new Date();

			return t.mock.method(SessionService.prototype, "validate", async () => ({
				data: {
					createdAt: now,
					expiresAt: new Date(now.getTime() + 10_000),
					id: "1",
					revokedAt: null,
					tokenId: tokenId ? tokenId : "tokenId",
					updatedAt: now,
					userId: userId ? userId : "507f1f77bcf86cd799439011",
				},
				success: true,
			}));
		}

		test("Should call CookieService.get with REFRESH_TOKEN", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			const mockGetCookie = setupMockGetCookie(t);
			setupMockVerifyJwt(t);
			setupMockValidateSession(t);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockGetCookie.mock.calls[0].arguments[0].name,
				CookieName.REFRESH_TOKEN,
			);
		});

		test("Should pass refresh token from CookieService to JwtService.verify(REFRESH)", async (t) => {
			// Arrange
			const refreshToken = "refresh-token-string";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			setupMockGetCookie(t, refreshToken);
			const mockVerifyJwt = setupMockVerifyJwt(t);
			setupMockValidateSession(t);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockVerifyJwt.mock.calls[0].arguments[0].token,
				refreshToken,
			);
		});

		test("Should call SessionService.validate with tokenId and userId from refresh token", async (t) => {
			// Arrange
			const userId = "507f1f77bcf86cd799439011";
			const tokenId = "00000000-0000-0000-0000-000000000000";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			setupMockGetCookie(t);
			setupMockVerifyJwt(t, tokenId);
			const mockValidateSession = setupMockValidateSession(t, userId, tokenId);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockValidateSession.mock.calls[0].arguments[0]?.tokenId,
				tokenId,
			);
			assert.strictEqual(
				mockValidateSession.mock.calls[0].arguments[0].userId,
				userId,
			);
		});

		test("Should call CookieService.get with ACCESS_TOKEN", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			const mockGetCookie = setupMockGetCookie(t);
			setupMockVerifyJwt(t);
			setupMockValidateSession(t);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockGetCookie.mock.calls[1].arguments[0].name,
				CookieName.ACCESS_TOKEN,
			);
		});

		test("Should pass access token from CookieService to JwtService.verify(ACCESS)", async (t) => {
			// Arrange
			const accessToken = "accessTokenString";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			setupMockGetCookie(t);
			const mockVerifyJwt = setupMockVerifyJwt(t);
			setupMockValidateSession(t);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockVerifyJwt.mock.calls[1].arguments[0].token,
				accessToken,
			);
		});

		test("Should set res.locals.userId on success", async (t) => {
			// Arrange
			const userId = "507f1f77bcf86cd799439011";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});
			setupMockGetCookie(t);
			setupMockVerifyJwt(t);
			setupMockValidateSession(t, userId);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(res.locals.userId, userId);
		});

		test("Should call next once without error on success", async (t) => {
			// Arrange
			const userId = "507f1f77bcf86cd799439011";
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			setupMockGetCookie(t);
			setupMockVerifyJwt(t);
			setupMockValidateSession(t, userId);

			// Act
			await authenticate(req as any, res as any, next);

			// Assert
			assert.strictEqual(next.mock.callCount(), 1);
		});

		test("Should call next with AuthenticationError when refresh cookie missing", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { cookies: {}, signedCookies: {} },
				testContext: t,
			});

			setupMockGetCookie(t);

			// Act & Assert
			await assert.rejects(
				async () => authenticate(req as any, res as any, next),
				AuthenticationError,
			);
		});
	});
});
