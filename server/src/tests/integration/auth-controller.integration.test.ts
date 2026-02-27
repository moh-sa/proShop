import { after, before, beforeEach, describe, suite } from "node:test";

import { AuthController } from "../../controllers/auth.controller.js";
import { Session } from "../../models/session.model.js";
import User from "../../models/user.model.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite(
	"Auth Controller〖 Integration Tests 〗",
	{ skip: true, todo: "IMPLEMENT" },
	() => {
		const controller = new AuthController(); // eslint-disable-line @typescript-eslint/no-unused-vars

		before(async () => await connectTestDatabase());
		after(async () => await disconnectTestDatabase());

		beforeEach(async () => {
			await User.deleteMany({});
			await Session.deleteMany({});
		});

		// I AM TIRED BOSS :')
		describe("signUp", () => {});
		describe("signIn", () => {});
		describe("signOut", () => {});
		describe("signOutAll", () => {});
		describe("refreshAccessToken", () => {});
		describe("getUserSessions", () => {});
		describe("revokeSession", () => {});
		describe("revokeAllSessions", () => {});
	},
);
