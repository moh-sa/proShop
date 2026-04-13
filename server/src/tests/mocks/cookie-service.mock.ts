 
import { mock } from "node:test";

import type { ICookieService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockCookieService(): FunctionMocksWithReset<ICookieService> {
	return {
		delete: mock.fn(),
		get: mock.fn(),
		set: mock.fn(),
		reset() {
			this.delete.mock.resetCalls();
			this.get.mock.resetCalls();
			this.set.mock.resetCalls();

			this.delete.mock.restore();
			this.get.mock.restore();
			this.set.mock.restore();
		},
	};
}
