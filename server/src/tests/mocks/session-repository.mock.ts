 
import { mock } from "node:test";

import type { ISessionRepository } from "../../repositories/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockSessionRepository(): FunctionMocksWithReset<ISessionRepository> {
	return {
		countActiveByUserId: mock.fn(),
		create: mock.fn(),
		deleteAllByUserId: mock.fn(),
		deleteByTokenIdAndUserId: mock.fn(),
		existsByTokenIdAndUserId: mock.fn(),
		getAll: mock.fn(),
		getAllActiveByUserId: mock.fn(),
		getAllByUserId: mock.fn(),
		getAllRevoked: mock.fn(),
		getAllRevokedByUserId: mock.fn(),
		getByTokenIdAndUserId: mock.fn(),
		revokeAllByUserId: mock.fn(),
		revokeByTokenIdAndUserId: mock.fn(),
		updateByTokenIdAndUserId: mock.fn(),

		reset() {
			this.create.mock.resetCalls();
			this.getByTokenIdAndUserId.mock.resetCalls();
			this.getAll.mock.resetCalls();
			this.getAllByUserId.mock.resetCalls();
			this.getAllActiveByUserId.mock.resetCalls();
			this.getAllRevokedByUserId.mock.resetCalls();
			this.getAllRevoked.mock.resetCalls();
			this.updateByTokenIdAndUserId.mock.resetCalls();
			this.deleteByTokenIdAndUserId.mock.resetCalls();
			this.deleteAllByUserId.mock.resetCalls();
			this.revokeByTokenIdAndUserId.mock.resetCalls();
			this.revokeAllByUserId.mock.resetCalls();
			this.existsByTokenIdAndUserId.mock.resetCalls();
			this.countActiveByUserId.mock.resetCalls();
		},
	};
}
