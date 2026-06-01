import { mock } from "node:test";

import type { IOrderManager } from "../../managers/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockOrderManager(): FunctionMocksWithReset<IOrderManager> {
	return {
		create: mock.fn(),
		getAll: mock.fn(),
		getById: mock.fn(),
		markAsCancelled: mock.fn(),
		markAsDelivered: mock.fn(),
		processPaymentWebhook: mock.fn(),
		reset() {
			this.create.mock.resetCalls();
			this.getAll.mock.resetCalls();
			this.getById.mock.resetCalls();
			this.markAsCancelled.mock.resetCalls();
			this.markAsDelivered.mock.resetCalls();
			this.processPaymentWebhook.mock.resetCalls();
			this.updatePayment.mock.resetCalls();

			this.create.mock.restore();
			this.getAll.mock.restore();
			this.getById.mock.restore();
			this.markAsCancelled.mock.restore();
			this.markAsDelivered.mock.restore();
			this.processPaymentWebhook.mock.restore();
			this.updatePayment.mock.restore();
		},
		updatePayment: mock.fn(),
	};
}
