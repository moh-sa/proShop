import { after, before, beforeEach, describe, suite } from "node:test";

import { PasswordService } from "../../services/index.js";
import { mockArgon2 } from "../mocks/argon2.mock.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("Password Service 〖 Integration Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockProvider = mockArgon2();
	const passwordService = new PasswordService(mockProvider as any); // eslint-disable-line @typescript-eslint/no-unused-vars

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(() => mockProvider.reset());

	// I AM TIRED BOSS :')
	describe("hash", () => {});
	describe("verify", () => {});
});
