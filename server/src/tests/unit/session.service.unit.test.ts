import { beforeEach, describe, suite } from "node:test";

import { SessionService } from "../../services/index.js";
import { mockSessionRepository } from "../mocks/index.js";

suite("Session Service〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockRepo = mockSessionRepository();
	const service = new SessionService(mockRepo); // eslint-disable-line @typescript-eslint/no-unused-vars

	beforeEach(() => mockRepo.reset());

	// I AM TIRED BOSS :')
	describe("create", () => {});
	describe("getActiveByUserId", () => {});
	describe("getByTokenIdAndUserId", () => {});
	describe("revokeAllByUserId", () => {});
	describe("revokeByTokenIdAndUserId", () => {});
	describe("validate", () => {});
});
