import { after, before, beforeEach, describe, suite } from "node:test";

import { SessionModel } from "../../models/session.model.js";
import { UserModel } from "../../models/user.model.js";
import { SessionRepository } from "../../repositories/index.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite(
	"Session Repository 〖 Integration Tests 〗",
	{ todo: "IMPLEMENT" },
	() => {
		const sessionRepository = new SessionRepository(); // eslint-disable-line @typescript-eslint/no-unused-vars

		before(async () => connectTestDatabase());
		after(async () => disconnectTestDatabase());

		beforeEach(async () => {
			await SessionModel.deleteMany({});
			await UserModel.deleteMany({});
		});

		// I AM TIRED BOSS :')
		describe("create", () => {});
		describe("getAll", () => {});
		describe("getAllActiveByUserId", () => {});
		describe("getAllByUserId", () => {});
		describe("getAllRevoked", () => {});
		describe("getAllRevokedByUserId", () => {});
		describe("getByTokenIdAndUserId", () => {});
		describe("updateByTokenIdAndUserId", () => {});
		describe("revokeAllByUserId", () => {});
		describe("revokeByTokenIdAndUserId", () => {});
		describe("deleteAllByUserId", () => {});
		describe("deleteByTokenIdAndUserId", () => {});
		describe("countActiveByUserId", () => {});
		describe("existsByTokenIdAndUserId", () => {});
	},
);
