 

import { mock } from "node:test";

import type * as argon2 from "argon2";

import type { FunctionMocksWithReset } from "../types/mocked.type.js";

type MockedArgon2 = Pick<typeof argon2, "hash" | "verify">;
export function mockArgon2(): FunctionMocksWithReset<MockedArgon2> {
	return {
		hash: mock.fn(),
		verify: mock.fn(),
		reset() {
			this.hash.mock.resetCalls();
			this.verify.mock.resetCalls();

			this.hash.mock.restore();
			this.verify.mock.restore();
		},
	};
}
