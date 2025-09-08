import { beforeEach, describe, suite } from "node:test";

import { AuthManager } from "../../managers/auth.manager.js";
import {
	mockJwtService,
	mockPasswordService,
	mockSessionService,
	mockUserService,
} from "../mocks/index.js";

suite(
	"Auth Manager 〖 Unit Tests 〗",
	{ skip: true, todo: "IMPLEMENT" },
	() => {
		const mockJwt = mockJwtService();
		const mockPassword = mockPasswordService();
		const mockSession = mockSessionService();
		const mockUser = mockUserService();
		const manager = new AuthManager( // eslint-disable-line @typescript-eslint/no-unused-vars
			mockJwt,
			mockPassword,
			mockSession,
			mockUser,
		);

		beforeEach(() => {
			mockJwt.reset();
			mockPassword.reset();
			mockSession.reset();
			mockUser.reset();
		});

		describe("getUserSessions", () => {});
		describe("refreshAccessToken", () => {});
		describe("revokeSession", () => {});
		describe("signIn", () => {});
		describe("signOut", () => {});
		describe("signOutAll", () => {});
		describe("signUp", () => {});
	},
);
