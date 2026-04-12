/* eslint-disable perfectionist/sort-objects */
import type jwt from "jsonwebtoken";

import { faker } from "@faker-js/faker";
import { mock } from "node:test";

import type { TokenDecoded, TokenPair } from "../../types/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

import { DEFAULT_JWT_CONFIG } from "../../config/jwt.config.js";
import { TokenType } from "../../types/index.js";
import { generateMockObjectId } from "./objectid.mock.js";

type mockedJwt = Pick<typeof jwt, "decode" | "sign" | "verify">;
export function mockJwt(): FunctionMocksWithReset<mockedJwt> {
	return {
		sign: mock.fn(),
		verify: mock.fn(),
		decode: mock.fn(),
		reset() {
			this.sign.mock.resetCalls();
			this.verify.mock.resetCalls();
			this.decode.mock.resetCalls();

			this.sign.mock.restore();
			this.verify.mock.restore();
			this.decode.mock.restore();
		},
	};
}

//

/**
 * Creates a mock JWT payload.
 * @param `type` - The type of token to create.
 * @returns A mock JWT payload.
 */
export function generateMockJwtPayload(
	type: TokenType,
	options: Partial<TokenDecoded> = {},
) {
	const now = new Date();
	const tokenId = faker.string.uuid();
	const userId = generateMockObjectId();

	const issuedAt = now.getTime() / 1000;

	const expirationTimeInMs =
		(type === "access"
			? DEFAULT_JWT_CONFIG.accessTokenExpiresIn
			: DEFAULT_JWT_CONFIG.refreshTokenExpiresIn) * 1000;
	const expiresAt =
		new Date(now.getTime() + expirationTimeInMs).getTime() / 1000;

	return {
		type,
		userId,
		tokenId,
		iat: issuedAt,
		exp: expiresAt,
		...options,
	};
}

/**
 * Creates a mock JWT token.
 * @param `type` - The type of token to create.
 * @param `options` - Optional overrides for the token payload.
 * @returns A mock JWT token.
 */
export function generateMockJwt(
	type: TokenType,
	options: Partial<TokenDecoded> = {},
) {
	return faker.internet.jwt({
		header: {
			alg: "HS256",
			typ: "JWT",
		},
		payload: {
			...generateMockJwtPayload(type),
			...options,
		},
	});
}

/**
 * Creates a mock token decoded object.
 * @param `options` - Optional overrides for the token decoded object.
 * @returns A mock token decoded object.
 */
export function generateMockTokenDecoded(
	type: TokenType,
	options: Partial<TokenDecoded> = {},
): TokenDecoded {
	const mockData = generateMockJwtPayload(type);
	return {
		exp: mockData.exp,
		iat: mockData.iat,
		tokenId: mockData.tokenId,
		type,
		userId: mockData.userId,
		...options,
	};
}

/**
 * Creates a mock token with data.
 * @param type - The type of token to create.
 * @param options - Optional overrides for the token data.
 * @returns A mock token with data.
 */
export function generateMockTokenWithData(
	type: TokenType,
	options: Partial<TokenDecoded> = {},
) {
	const data = { ...generateMockJwtPayload(type), ...options };
	const token = generateMockJwt(type, data);
	return {
		...data,
		token,
	};
}

/**
 * Creates a mock token pair with data.
 * @param options - Optional overrides for the token pair.
 * @returns A mock token pair with data.
 */
export function generateMockTokenPairWithData(
	options: Partial<TokenPair> = {},
): TokenPair {
	const access = generateMockTokenWithData("access", options.access);
	const refresh = generateMockTokenWithData("refresh", options.refresh);

	return {
		access: {
			expiresAt: new Date(access.exp * 1000),
			token: access.token,
			tokenId: access.tokenId,
		},
		refresh: {
			expiresAt: new Date(refresh.exp * 1000),
			token: refresh.token,
			tokenId: refresh.tokenId,
		},
	};
}
