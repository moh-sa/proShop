import { after, before, beforeEach, describe, suite } from "node:test";

import { Session } from "../../models/session.model.js";
import User from "../../models/userModel.js";
import { SessionService } from "../../services/session.service.js";
import { mockSessionRepository } from "../mocks/session-repository.mock.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("Session Service 〖 Integration Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockRepo = mockSessionRepository();
	const service = new SessionService(mockRepo); // eslint-disable-line @typescript-eslint/no-unused-vars

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(() => mockRepo.reset());

	beforeEach(async () => {
		await Session.deleteMany({});
		await User.deleteMany({});
	});

	// I AM TIRED BOSS :')
	describe("create", () => {});
	describe("getActiveByUserId", () => {});
	describe("getByTokenIdAndUserId", () => {});
	describe("revokeAllByUserId", () => {});
	describe("revokeByTokenIdAndUserId", () => {});
	describe("validate", () => {});
});
