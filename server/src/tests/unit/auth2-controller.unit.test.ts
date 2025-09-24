import { beforeEach, describe, suite } from "node:test";

import { Auth2Controller } from "../../controllers/auth2.controller.js";
import { mockAuthManager, mockCookieService } from "../mocks/index.js";

suite("Auth Controller (v2)〖 Unit Tests 〗", () => {
	const mockManager = mockAuthManager();
	const mockCookie = mockCookieService();
	const controller = new Auth2Controller(mockManager, mockCookie as any);

	beforeEach(() => {
		mockManager.reset();
		mockCookie.reset();
	});

	describe("signUp", () => {});
	describe("signIn", () => {});
	describe("signOut", () => {});
	describe("signOutAll", () => {});
	describe("refreshAccessToken", () => {});
	describe("getUserSessions", () => {});
	describe("revokeSession", () => {});
	describe("revokeAllSessions", () => {});
});
