import { Mock, mock } from "node:test";
import type Stripe from "stripe";
import { FunctionMocksWithReset } from "../types/mocked.type.js";

type StripeSessionCreateFn = (
	params?: Stripe.Checkout.SessionCreateParams,
	options?: Stripe.RequestOptions,
) => Promise<Stripe.Response<Stripe.Checkout.Session>>;

type StripeMockedMethods = {
	checkout: {
		sessions: {
			create: Mock<StripeSessionCreateFn>;
		};
	};
};

export function mockStripe(): FunctionMocksWithReset<StripeMockedMethods> {
	return {
		checkout: {
			sessions: {
				create: mock.fn(),
			},
		},
		reset() {
			this.checkout.sessions.create.mock.resetCalls();

			this.checkout.sessions.create.mock.restore();
		},
	};
}