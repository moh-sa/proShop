import type { IPaymentService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockPaymentService(): FunctionMocksWithReset<IPaymentService> {
	return {
		reset() {},
	};
}
