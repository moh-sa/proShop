/* eslint-disable perfectionist/sort-objects */
import type jwt from "jsonwebtoken";

import { mock } from "node:test";

import type { FunctionMocksWithReset } from "../types/mocked.type.js";

type mockedJwt = Pick<typeof jwt, "decode" | "sign" | "verify">;
export function mockJwt(): FunctionMocksWithReset<mockedJwt> {
	return {
		sign: mock.fn(),
		verify: mock.fn(),
		decode: mock.fn(),
		reset() {
			this.sign.mock.resetCalls();
			this.verify.mock.resetCalls();
			this.decode.mock.resetCalls();

			this.sign.mock.restore();
			this.verify.mock.restore();
			this.decode.mock.restore();
		},
	};
}
