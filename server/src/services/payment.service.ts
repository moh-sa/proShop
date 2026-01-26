import type Stripe from "stripe";

import type { Result } from "../types/index.js";

import { stripeClient } from "../config/index.js";
import { getLoggerFromContext } from "../utils/index.js";

export interface IPaymentService {}

type PaymentResult<T> = Result<T>;

export class PaymentService implements IPaymentService {
	private readonly _provider: Stripe;

	constructor(provider?: Stripe) {
		this._provider = provider ?? stripeClient;
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "payment service", ...args });
	}
}
