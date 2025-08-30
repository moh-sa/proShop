import { describe, suite } from "node:test";

import { SessionService } from "../../services/index.js";
import { mockSessionService } from "../mocks/session-service.mock.js";

suite("Session Service〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const service = new SessionService(); // eslint-disable-line @typescript-eslint/no-unused-vars
	const mockService = mockSessionService(); // eslint-disable-line @typescript-eslint/no-unused-vars

	// I AM TIRED BOSS :')
	describe("create", () => {});
	describe("getActiveByUserId", () => {});
	describe("getByTokenIdAndUserId", () => {});
	describe("revokeAllByUserId", () => {});
	describe("revokeByTokenIdAndUserId", () => {});
	describe("validate", () => {});
});
