import { mock } from "node:test";

import type { IOrderRepository } from "../../repositories/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockOrderRepository(): FunctionMocksWithReset<IOrderRepository> {
	return {
		create: mock.fn(),
		getAll: mock.fn(),
		getById: mock.fn(),
		reset() {
			this.create.mock.resetCalls();
			this.getAll.mock.resetCalls();
			this.getById.mock.resetCalls();
			this.updatePayment.mock.resetCalls();
			this.updateStatus.mock.resetCalls();

			this.create.mock.restore();
			this.getAll.mock.restore();
			this.getById.mock.restore();
			this.updatePayment.mock.restore();
			this.updateStatus.mock.restore();
		},
		updatePayment: mock.fn(),
		updateStatus: mock.fn(),
	};
}
