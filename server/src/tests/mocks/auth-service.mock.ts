import { mock } from "node:test";

import type { IAuthService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockAuthService(): FunctionMocksWithReset<IAuthService> {
	return {
		reset() {
			this.signup.mock.resetCalls();
			this.signin.mock.resetCalls();

			this.signup.mock.restore();
			this.signin.mock.restore();
		},
		signin: mock.fn(),
		signup: mock.fn(),
	};
}
