import type Stripe from "stripe";
import { FunctionMocksWithReset } from "../types/mocked.type";

// the "Partial" is temporary
export function mockStripe(): FunctionMocksWithReset<Partial<Stripe>> {
	return {
		reset() {},
	};
}
