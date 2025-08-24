import { describe, suite } from "node:test";

import { SessionRepository } from "../../repositories/index.js";

suite("Session Repository〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const repo = new SessionRepository(); // eslint-disable-line @typescript-eslint/no-unused-vars

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
});
