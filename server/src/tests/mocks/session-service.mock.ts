/* eslint-disable perfectionist/sort-objects */

import { mock } from "node:test";

import type { ISessionService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockSessionService(): FunctionMocksWithReset<ISessionService> {
	return {
		create: mock.fn(),
		deleteAllByUserId: mock.fn(),
		deleteByTokenIdAndUserId: mock.fn(),
		getActiveByUserId: mock.fn(),
		getByTokenIdAndUserId: mock.fn(),
		revokeAllByUserId: mock.fn(),
		revokeByTokenIdAndUserId: mock.fn(),
		validate: mock.fn(),
		reset() {
			this.create.mock.resetCalls();
			this.deleteAllByUserId.mock.resetCalls();
			this.deleteByTokenIdAndUserId.mock.resetCalls();
			this.getActiveByUserId.mock.resetCalls();
			this.getByTokenIdAndUserId.mock.resetCalls();
			this.revokeAllByUserId.mock.resetCalls();
			this.revokeByTokenIdAndUserId.mock.resetCalls();
			this.validate.mock.resetCalls();

			this.create.mock.restore();
			this.deleteAllByUserId.mock.restore();
			this.deleteByTokenIdAndUserId.mock.restore();
			this.getActiveByUserId.mock.restore();
			this.getByTokenIdAndUserId.mock.restore();
			this.revokeAllByUserId.mock.restore();
			this.revokeByTokenIdAndUserId.mock.restore();
			this.validate.mock.restore();
		},
	};
}
