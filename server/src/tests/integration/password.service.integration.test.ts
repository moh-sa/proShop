import { after, before, beforeEach, describe, suite } from "node:test";

import type * as Argon2 from "argon2";

import { PasswordService } from "../../services/index.js";
import { mockArgon2 } from "../mocks/argon2.mock.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("Password Service 〖 Integration Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockProvider = mockArgon2();
	const _passwordService = new PasswordService(
		mockProvider as unknown as typeof Argon2,
	);

	before(async () => connectTestDatabase());
	after(async () => disconnectTestDatabase());
	beforeEach(() => mockProvider.reset());

	// I AM TIRED BOSS :')
	describe("hash", () => {});
	describe("verify", () => {});
});
