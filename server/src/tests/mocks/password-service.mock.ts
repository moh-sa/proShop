 
import { mock } from "node:test";

import type { IPasswordService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockPasswordService(): FunctionMocksWithReset<IPasswordService> {
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
