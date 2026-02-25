import { mock } from "node:test";

import type { IOrderService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockOrderService(): FunctionMocksWithReset<IOrderService> {
	return {
		create: mock.fn(),
		getAll: mock.fn(),
		getById: mock.fn(),

		reset() {
			this.create.mock.resetCalls();
			this.getAll.mock.resetCalls();
			this.getById.mock.resetCalls();
			this.updatePayment.mock.resetCalls();

			this.create.mock.restore();
			this.getAll.mock.restore();
			this.getById.mock.restore();
			this.updatePayment.mock.restore();
		},
		updatePayment: mock.fn(),
	};
}
