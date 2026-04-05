import { after, before, beforeEach, describe, suite } from "node:test";

import { SessionModel } from "../../models/session.model.js";
import { UserModel } from "../../models/user.model.js";
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
		await SessionModel.deleteMany({});
		await UserModel.deleteMany({});
	});

	// I AM TIRED BOSS :')
	describe("create", () => {});
	describe("getActiveByUserId", () => {});
	describe("getByTokenIdAndUserId", () => {});
	describe("revokeAllByUserId", () => {});
	describe("revokeByTokenIdAndUserId", () => {});
	describe("validate", () => {});
});
