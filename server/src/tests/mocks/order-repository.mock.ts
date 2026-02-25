import { mock } from "node:test";

import type { IOrderRepository } from "../../repositories/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockOrderRepository(): FunctionMocksWithReset<IOrderRepository> {
	return {
		create: mock.fn(),
		getAll: mock.fn(),
		getById: mock.fn(),
		markAsProcessing: mock.fn(),
		reset() {
			this.create.mock.resetCalls();
			this.getAll.mock.resetCalls();
			this.getById.mock.resetCalls();
			this.markAsProcessing.mock.resetCalls();
			this.updatePayment.mock.resetCalls();

			this.create.mock.restore();
			this.getAll.mock.restore();
			this.getById.mock.restore();
			this.markAsProcessing.mock.restore();
			this.updatePayment.mock.restore();
		},
		updatePayment: mock.fn(),
	};
}
