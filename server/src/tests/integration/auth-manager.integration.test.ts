import { after, before, beforeEach, describe, suite } from "node:test";

import { AuthManager } from "../../managers/index.js";
import { SessionModel } from "../../models/session.model.js";
import { UserModel } from "../../models/user.model.js";
import { connectTestDatabase, disconnectTestDatabase } from "../utils/index.js";

suite(
	"Auth Manager 〖 Integration Tests 〗",
	{ skip: true, todo: "IMPLEMENT" },
	() => {
		const manager = new AuthManager(); // eslint-disable-line @typescript-eslint/no-unused-vars
		before(async () => connectTestDatabase());
		after(async () => disconnectTestDatabase());

		beforeEach(async () => {
			await SessionModel.deleteMany({});
			await UserModel.deleteMany({});
		});

		// I AM TIRED BOSS :')
		describe("getUserSessions", () => {});
		describe("refreshAccessToken", () => {});
		describe("revokeSession", () => {});
		describe("signIn", () => {});
		describe("signOut", () => {});
		describe("signOutAll", () => {});
		describe("signUp", () => {});
	},
);
