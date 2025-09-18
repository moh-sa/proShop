import { beforeEach, describe, suite } from "node:test";

import { Auth2Controller } from "../../controllers/auth2.controller.js";
import { mockAuthManager } from "../mocks/index.js";

suite(
	"Auth Controller (v2)〖 Unit Tests 〗",
	{ skip: true, todo: "IMPLEMENT" },
	() => {
		const mockManager = mockAuthManager();
		const controller = new Auth2Controller(mockManager); // eslint-disable-line @typescript-eslint/no-unused-vars

		beforeEach(() => {
			mockManager.reset();
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
