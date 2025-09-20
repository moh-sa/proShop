import { beforeEach, describe, suite } from "node:test";

import { DEFAULT_JWT_CONFIG } from "../../config/jwt.config.js";
import { JwtService } from "../../services/index.js";
import { mockJwt } from "../mocks/jwt.mock.js";

suite("JWT Service〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockJWT = mockJwt();
	const service = new JwtService(DEFAULT_JWT_CONFIG, mockJWT as any); // eslint-disable-line @typescript-eslint/no-unused-vars

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

	// I AM TIRED BOSS :')
	describe("generateAccessToken", () => {});
	describe("generateRefreshToken", () => {});
	describe("generateTokenPair", () => {});
	describe("refreshAccessToken", () => {});
	describe("verify", () => {});
});
