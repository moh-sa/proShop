import { beforeEach, describe, suite } from "node:test";

import { PasswordService } from "../../services/index.js";
import { mockArgon2 } from "../mocks/argon2.mock.js";

suite("Password Service 〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockProvider = mockArgon2();
	const service = new PasswordService(mockProvider as any); // eslint-disable-line @typescript-eslint/no-unused-vars

	beforeEach(() => mockProvider.reset());

	// I AM TIRED BOSS :')
	describe("hash", () => {});
	describe("verify", () => {});
});
