import { mock } from "node:test";

import type { IOrderManager } from "../../managers/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockOrderManager(): FunctionMocksWithReset<IOrderManager> {
	return {
		create: mock.fn(),
		getAll: mock.fn(),
		getById: mock.fn(),
		processPaymentWebhook: mock.fn(),
		reset() {
			this.create.mock.resetCalls();
			this.getAll.mock.resetCalls();
			this.getById.mock.resetCalls();
			this.processPaymentWebhook.mock.resetCalls();
			this.updatePayment.mock.resetCalls();
			this.updateStatus.mock.resetCalls();

			this.create.mock.restore();
			this.getAll.mock.restore();
			this.getById.mock.restore();
			this.processPaymentWebhook.mock.restore();
			this.updatePayment.mock.restore();
			this.updateStatus.mock.restore();
		},
		updatePayment: mock.fn(),
		updateStatus: mock.fn(),
	};
}
