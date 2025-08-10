import { mock } from "node:test";

import type { ICacheManager } from "../../managers/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockCacheManager(): FunctionMocksWithReset<ICacheManager> {
	return {
		delete: mock.fn(),
		deleteMany: mock.fn(),
		flush: mock.fn(),
		flushStats: mock.fn(),
		get: mock.fn(),
		getKeys: mock.fn(),
		getMany: mock.fn(),
		getStats: mock.fn(),
		isKeyCached: mock.fn(),
		reset() {
			this.set.mock.resetCalls();
			this.setMany.mock.resetCalls();
			this.get.mock.resetCalls();
			this.getMany.mock.resetCalls();
			this.delete.mock.resetCalls();
			this.take.mock.resetCalls();
			this.flush.mock.resetCalls();
			this.flushStats.mock.resetCalls();
			this.getStats.mock.resetCalls();
			this.getKeys.mock.resetCalls();
			this.deleteMany.mock.resetCalls();
			this.isKeyCached.mock.resetCalls();

			this.set.mock.restore();
			this.setMany.mock.restore();
			this.get.mock.restore();
			this.getMany.mock.restore();
			this.delete.mock.restore();
			this.take.mock.restore();
			this.flush.mock.restore();
			this.flushStats.mock.restore();
			this.getStats.mock.restore();
			this.getKeys.mock.restore();
			this.deleteMany.mock.restore();
			this.isKeyCached.mock.restore();
		},
		set: mock.fn(),
		setMany: mock.fn(),
		take: mock.fn(),
	};
}
