import { JsonWebTokenError } from "jsonwebtoken";
import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";

import { DEFAULT_JWT_CONFIG } from "../../config/index.js";
import {
	JwtGenerationError,
	JwtInvalidPayloadError,
	JwtInvalidTokenError,
} from "../../errors/index.js";
import { JwtService } from "../../services/index.js";
import { TokenType } from "../../types/index.js";
import { mockJwt } from "../mocks/index.js";

suite("JWT Service〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockJWT = mockJwt();
	const service = new JwtService(DEFAULT_JWT_CONFIG, mockJWT as any);

	const userId = "user-id";
	const tokenId = "token-id";
	const expiresAt = new Date(2025, 9, 20); // the date of the tokens creation
	const invalidAccessToken = "invalid-access-token";
	const invalidRefreshToken = "invalid-refresh-token";
	const validAccessToken =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWNjZXNzIiwidXNlcklkIjoidXNlci1pZCIsInRva2VuSWQiOiI5YjEyNzEyZS00YTVjLTQwYTMtYjA1YS0wZGY1MWNiYTgyZDMiLCJpYXQiOjE3NTg0MDQ2NDcsImV4cCI6MTc1ODQwNTU0N30.EZtylbw7moO-xIsuRETg6yxsz34bEdLor8HBu7xCHP4";
	const validRefreshToken =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVmcmVzaCIsInVzZXJJZCI6InVzZXItaWQiLCJ0b2tlbklkIjoiYjk1N2E2Y2ItOTUwYy00MGExLTg3MGQtZDdjODcxMWNhODdiIiwiaWF0IjoxNzU4Mzc5ODA4LCJleHAiOjE3NjA5NzE4MDh9.z2eoFPl6zwcl_YzZyMePxEJCDK2lKzob65tzeN1T42w";

	beforeEach(() => mockJWT.reset());

	describe("generateAccessToken", () => {
		it("should successfully generate access token with valid userId", (t) => {
			// Arrange
			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.sign.mock.mockImplementation(() => validAccessToken);

			mockJWT.decode.mock.mockImplementation(() => ({
				exp: expiresAt.getTime() / 1000,
			}));

			// Act
			const result = service.generateAccessToken({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.token, validAccessToken);
			assert.strictEqual(result.data.tokenId, tokenId);
			assert.strictEqual(result.data.expiresAt.getTime(), expiresAt.getTime());

			// Verify jwt.sign was called with correct parameters
			const signCall = mockJWT.sign.mock;
			assert.strictEqual(signCall.callCount(), 1);
			assert.deepStrictEqual(signCall.calls[0].arguments[0], {
				tokenId,
				type: TokenType.ACCESS,
				userId,
			});
			assert.strictEqual(
				signCall.calls[0].arguments[1],
				DEFAULT_JWT_CONFIG.accessTokenSecret,
			);
			assert.deepStrictEqual(signCall.calls[0].arguments[2], {
				expiresIn: DEFAULT_JWT_CONFIG.accessTokenExpiresIn,
			});
		});

		it("should fail when userId is empty string", () => {
			// Arrange
			const userId = "";

			// Act
			const result = service.generateAccessToken({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtInvalidPayloadError);
			assert(result.error.message.includes("Invalid JWT token payload"));

			// Verify jwt.sign was not called
			assert.strictEqual(mockJWT.sign.mock.callCount(), 0);
		});

		it("should fail when userId is whitespace only", () => {
			// Arrange
			const userId = "   ";

			// Act
			const result = service.generateAccessToken({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtInvalidPayloadError);
			assert(result.error.message.includes("Invalid JWT token payload"));

			// Verify jwt.sign was not called
			assert.strictEqual(mockJWT.sign.mock.callCount(), 0);
		});

		it("should fail when JWT provider throws an error", (t) => {
			// Arrange
			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.sign.mock.mockImplementation(() => {
				throw new Error("JWT signing failed");
			});

			// Act
			const result = service.generateAccessToken({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtGenerationError);
			assert(result.error.message.includes("Failed to generate JWT token"));
		});

		it("should fail when token decode returns invalid expiration", (t) => {
			// Arrange
			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.sign.mock.mockImplementation(() => validAccessToken);

			mockJWT.decode.mock.mockImplementation(() => ({}));

			// Act
			const result = service.generateAccessToken({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtInvalidTokenError);
			assert(result.error.message.includes("Invalid JWT token format"));
		});

		it("should fail when token decode returns string instead of object", (t) => {
			// Arrange
			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.sign.mock.mockImplementation(() => validAccessToken);

			mockJWT.decode.mock.mockImplementation(() => "invalid-decoded-token");

			// Act
			const result = service.generateAccessToken({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtInvalidTokenError);
			assert(result.error.message.includes("Invalid JWT token format"));
		});
	});

	describe("generateRefreshToken", () => {
		it("should successfully generate refresh token with valid userId", (t) => {
			// Arrange
			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.sign.mock.mockImplementation(() => validRefreshToken);

			mockJWT.decode.mock.mockImplementation(() => ({
				exp: expiresAt.getTime() / 1000,
			}));

			// Act
			const result = service.generateRefreshToken({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.token, validRefreshToken);
			assert.strictEqual(result.data.tokenId, tokenId);
			assert.strictEqual(result.data.expiresAt.getTime(), expiresAt.getTime());

			// Verify jwt.sign was called with correct parameters
			const signCall = mockJWT.sign.mock;
			assert.strictEqual(signCall.callCount(), 1);
			assert.deepStrictEqual(signCall.calls[0].arguments[0], {
				tokenId,
				type: TokenType.REFRESH,
				userId,
			});
			assert.strictEqual(
				signCall.calls[0].arguments[1],
				DEFAULT_JWT_CONFIG.refreshTokenSecret,
			);
			assert.deepStrictEqual(signCall.calls[0].arguments[2], {
				expiresIn: DEFAULT_JWT_CONFIG.refreshTokenExpiresIn,
			});
		});

		it("should fail when userId is empty string", () => {
			// Arrange
			const userId = "";

			// Act
			const result = service.generateRefreshToken({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtInvalidPayloadError);
			assert(result.error.message.includes("Invalid JWT token payload"));

			// Verify jwt.sign was not called
			assert.strictEqual(mockJWT.sign.mock.callCount(), 0);
		});

		it("should fail when userId is whitespace only", () => {
			// Arrange
			const userId = "   ";

			// Act
			const result = service.generateRefreshToken({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtInvalidPayloadError);
			assert(result.error.message.includes("Invalid JWT token payload"));

			// Verify jwt.sign was not called
			assert.strictEqual(mockJWT.sign.mock.callCount(), 0);
		});

		it("should fail when JWT provider throws an error", (t) => {
			// Arrange
			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.sign.mock.mockImplementation(() => {
				throw new Error("JWT signing failed");
			});

			// Act
			const result = service.generateRefreshToken({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtGenerationError);
			assert(result.error.message.includes("Failed to generate JWT token"));
		});
	});

	describe("generateTokenPair", () => {
		it("should successfully generate both access and refresh tokens", (t) => {
			// Arrange
			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.sign.mock.mockImplementation((payload: any) =>
				payload.type === TokenType.ACCESS
					? validAccessToken
					: validRefreshToken,
			);

			mockJWT.decode.mock.mockImplementation(() => ({
				exp: expiresAt.getTime() / 1000,
			}));

			// Act
			const result = service.generateTokenPair({ userId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.access.token, validAccessToken);
			assert.strictEqual(result.data.access.tokenId, tokenId);

			assert.strictEqual(result.data.refresh.token, validRefreshToken);
			assert.strictEqual(result.data.refresh.tokenId, tokenId);

			// Verify jwt.sign was called twice
			assert.strictEqual(mockJWT.sign.mock.callCount(), 2);
		});

		it("should fail when access token generation fails", () => {
			// Arrange
			const userId = "";

			// Act
			const result = service.generateTokenPair({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtInvalidPayloadError);

			// Verify no tokens were generated after the failure
			assert.strictEqual(mockJWT.sign.mock.callCount(), 0);
		});

		it("should fail when refresh token generation fails", (t) => {
			// Arrange
			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.sign.mock.mockImplementation((payload: any) => {
				if (payload.type === TokenType.ACCESS) {
					return validAccessToken;
				}

				throw new Error("Refresh token generation failed");
			});

			mockJWT.decode.mock.mockImplementation(() => ({
				exp: expiresAt.getTime() / 1000,
			}));

			// Act
			const result = service.generateTokenPair({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtGenerationError);

			// Verify both tokens were attempted
			assert.strictEqual(mockJWT.sign.mock.callCount(), 2);
		});
	});

	describe("refreshAccessToken", () => {
		// the date of the refresh token creation
		const mockExpiresAt = new Date(2020, 9, 20);

		it("should successfully refresh access token with valid refresh token", (t) => {
			// Arrange
			const mockRefreshDecoded = {
				exp: mockExpiresAt.getTime() / 1000 + 3600,
				iat: mockExpiresAt.getTime() / 1000,
				tokenId,
				type: TokenType.REFRESH,
				userId,
			};

			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.verify.mock.mockImplementation(() => mockRefreshDecoded);

			mockJWT.sign.mock.mockImplementation(() => validAccessToken);

			mockJWT.decode.mock.mockImplementation(() => ({
				exp: mockExpiresAt.getTime() / 1000 + 3600,
			}));

			// Act
			const result = service.refreshAccessToken({
				refreshToken: validRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.access.token, validAccessToken);
			assert.strictEqual(result.data.access.tokenId, tokenId);
			assert.deepStrictEqual(
				result.data.decodedRefreshToken,
				mockRefreshDecoded,
			);

			// Verify jwt.verify was called for refresh token
			const verifyCall = mockJWT.verify.mock;
			assert.strictEqual(verifyCall.callCount(), 1);
			assert.strictEqual(verifyCall.calls[0].arguments[0], validRefreshToken);
			assert.strictEqual(
				verifyCall.calls[0].arguments[1],
				DEFAULT_JWT_CONFIG.refreshTokenSecret,
			);
		});

		it("should fail when refresh token verification fails", () => {
			// Arrange
			mockJWT.verify.mock.mockImplementation(() => {
				throw new JsonWebTokenError("Invalid token");
			});

			// Act
			const result = service.refreshAccessToken({
				refreshToken: invalidRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtInvalidTokenError);

			// Verify jwt.sign was not called for new access token
			assert.strictEqual(mockJWT.sign.mock.callCount(), 0);
		});

		it("should fail when access token generation fails after refresh token verification", (t) => {
			// Arrange
			const mockRefreshDecoded = {
				exp: mockExpiresAt.getTime() / 1000 + 3600,
				iat: mockExpiresAt.getTime() / 1000,
				tokenId,
				type: TokenType.REFRESH,
				userId,
			};

			t.mock.method(crypto, "randomUUID", () => tokenId);

			mockJWT.verify.mock.mockImplementation(() => mockRefreshDecoded);

			mockJWT.sign.mock.mockImplementation(() => {
				throw new Error("Access token generation failed");
			});

			// Act
			const result = service.refreshAccessToken({
				refreshToken: validRefreshToken,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof JwtGenerationError);

			// Verify jwt.verify was called but jwt.sign failed
			assert.strictEqual(mockJWT.verify.mock.callCount(), 1);
			assert.strictEqual(mockJWT.sign.mock.callCount(), 1);
		});
	});
	describe("verify", () => {});
});
