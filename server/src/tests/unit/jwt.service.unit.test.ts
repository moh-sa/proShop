import { beforeEach, describe, suite } from "node:test";

import { DEFAULT_JWT_CONFIG } from "../../config/jwt.config.js";
import { JwtService } from "../../services/index.js";
import { mockJwt } from "../mocks/jwt.mock.js";

suite("JWT Service〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockJWT = mockJwt();
	const service = new JwtService(DEFAULT_JWT_CONFIG, mockJWT as any); // eslint-disable-line @typescript-eslint/no-unused-vars

	beforeEach(() => mockJWT.reset());

	// I AM TIRED BOSS :')
	describe("generateAccessToken", () => {});
	describe("generateRefreshToken", () => {});
	describe("generateTokenPair", () => {});
	describe("refreshAccessToken", () => {});
	describe("verify", () => {});
});
