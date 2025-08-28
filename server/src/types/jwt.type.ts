export enum TokenType {
	ACCESS = "access",
	REFRESH = "refresh",
}

export interface JwtConfig {
	readonly accessTokenSecret: string;
	readonly refreshTokenSecret: string;
	/**
	 * @description short lived token expressed in **`seconds`**
	 */
	readonly accessTokenExpiresIn: number;
	/**
	 * @description long lived token expressed in **`seconds`**
	 */
	readonly refreshTokenExpiresIn: number;
}

export interface TokenDecoded {
	exp: number;
	iat: number;
	type: TokenType;
	readonly userId: string;
}

export interface TokenPair {
	readonly access: TokenResult;
	readonly refresh: TokenResult;
}

export interface TokenPayload {
	readonly type: TokenType;
	readonly userId: string;
}

export type TokenResult = { expiresAt: Date; token: string };
