 
import { mock } from "node:test";

import type { IJwtService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockJwtService(): FunctionMocksWithReset<IJwtService> {
	return {
		generateAccessToken: mock.fn(),
		generateRefreshToken: mock.fn(),
		generateTokenPair: mock.fn(),
		refreshAccessToken: mock.fn(),
		verify: mock.fn(),
		reset() {
			this.generateAccessToken.mock.resetCalls();
			this.generateRefreshToken.mock.resetCalls();
			this.generateTokenPair.mock.resetCalls();
			this.refreshAccessToken.mock.resetCalls();
			this.verify.mock.resetCalls();

			this.generateAccessToken.mock.restore();
			this.generateRefreshToken.mock.restore();
			this.generateTokenPair.mock.restore();
			this.refreshAccessToken.mock.restore();
			this.verify.mock.restore();
		},
	};
}
