import type { Logger } from "pino";
import type { z } from "zod";

import Stripe from "stripe";

import type {
	CreateCheckoutSessionParams,
	CreateCheckoutSessionResponse,
	FailureResult,
	MethodParams,
	MethodReturn,
	Result,
	VerifyWebhookParams,
	VerifyWebhookResponse,
} from "../types/index.js";

import { env, stripeClient } from "../config/index.js";
import { PAYMENT_MIN_USD_CHARGE } from "../constants/payment.constants.js";
import {
	InternalError,
	RateLimitError,
	ValidationError,
} from "../errors/index.js";
import { createCheckoutSessionParamsSchema } from "../schemas/index.js";
import { formatZodErrors, getLoggerFromContext } from "../utils/index.js";

export interface IPaymentService {
	/**
	 * Creates a Stripe checkout session for processing payment
	 *
	 * @param params - Checkout session configuration
	 * @returns session ID and redirect URL, or error
	 */
	createCheckoutSession(
		args: CreateCheckoutSessionParams,
	): Promise<PaymentResult<CreateCheckoutSessionResponse>>;

	/**
	 * Verifies webhook signature to ensure request came from Stripe.
	 *
	 * Payload **MUST** be the raw request body (Buffer), not parsed JSON.
	 */
	verifyWebhook(
		params: VerifyWebhookParams,
	): PaymentResult<VerifyWebhookResponse>;
}

type PaymentResult<T> = Result<T>;

export class PaymentService implements IPaymentService {
	private readonly _provider: Stripe;

	constructor(provider?: Stripe) {
		this._provider = provider ?? stripeClient;
	}

	public async createCheckoutSession(
		params: MethodParams<IPaymentService, "createCheckoutSession">,
	): MethodReturn<IPaymentService, "createCheckoutSession"> {
		const logger = this._getLogger({ method: "createCheckoutSession" });

		logger.debug({ params }, "Creating checkout session");

		// validate parameters
		const validationResult = this._safeValidate(
			createCheckoutSessionParamsSchema,
			params,
			logger,
		);
		if (!validationResult.success) {
			return validationResult;
		}

		// check total amount is greater than minimum charge
		const totalAmount = validationResult.data.items.reduce(
			(acc, item) => acc + item.unitAmount * item.quantity,
			0,
		);
		if (totalAmount < PAYMENT_MIN_USD_CHARGE) {
			logger.warn(
				{ minCharge: PAYMENT_MIN_USD_CHARGE, totalAmount },
				"Total amount is less than minimum charge",
			);
			return {
				error: new ValidationError("Total amount is less than minimum charge"),
				success: false,
			};
		}

		logger.debug(
			{ validatedData: validationResult.data },
			"Validated checkout session parameters",
		);

		// transform 'items' to stripe's line items
		const stripeLineItems = validationResult.data.items.map((item) => ({
			price_data: {
				currency: validationResult.data.currency,
				product_data: {
					name: item.name,
				},
				unit_amount: item.unitAmount,
			},
			quantity: item.quantity,
		}));

		try {
			// create checkout session
			const session = await this._provider.checkout.sessions.create({
				cancel_url: validationResult.data.cancelUrl,
				customer_email: validationResult.data.userEmail,
				line_items: stripeLineItems,
				metadata: {
					orderId: validationResult.data.orderId,
				},
				mode: "payment",
				success_url: validationResult.data.successUrl,
			});

			// Stripe's checkout session should always include a URL for redirecting the user
			// If missing, something went wrong on Stripe's side
			if (!session.url) {
				logger.error(
					"Failed to create checkout session due to missing session URL",
				);
				return {
					error: new InternalError(
						"Failed to create checkout session due to missing session URL",
					),
					success: false,
				};
			}

			return {
				data: {
					id: session.id,
					url: session.url,
				},
				success: true,
			};
		} catch (error) {
			return this._handleProviderError(error, logger);
		}
	}

	public verifyWebhook(
		params: MethodParams<IPaymentService, "verifyWebhook">,
	): MethodReturn<IPaymentService, "verifyWebhook"> {
		const logger = this._getLogger({ method: "verifyWebhook" });
		logger.debug("Verifying webhook");

		try {
			const event = this._provider.webhooks.constructEvent(
				params.payload,
				params.signature,
				env.STRIPE_WEBHOOK_SECRET,
			);

			logger.info(
				{
					eventId: event.id,
					eventType: event.type,
				},
				"Webhook event verified successfully",
			);

			if (!("metadata" in event.data.object) || !event.data.object.metadata) {
				logger.warn(
					{ eventData: event.data.object },
					"Invalid webhook metadata",
				);
				return {
					error: new ValidationError("Invalid webhook metadata"),
					success: false,
				};
			}

			const metadata = event.data.object
				.metadata as VerifyWebhookResponse["metadata"];

			return {
				data: {
					metadata,
					paidAt: new Date(event.created * 1000),
					type: event.type,
				},
				success: true,
			};
		} catch (error) {
			if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
				logger.error(error, "Invalid webhook signature");
				return {
					error: new ValidationError("Invalid webhook signature", {
						cause: error,
					}),
					success: false,
				};
			}

			logger.error(error, "Failed to verify webhook signature");
			return {
				error: new InternalError("Failed to verify webhook signature", {
					cause: error,
				}),
				success: false,
			};
		}
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "payment service", ...args });
	}

	private _handleProviderError(error: unknown, logger: Logger): FailureResult {
		if (error instanceof Stripe.errors.StripeInvalidRequestError) {
			logger.error(error, "Invalid request to Stripe");
			return {
				error: new ValidationError(error.message, { cause: error }),
				success: false,
			};
		}

		if (error instanceof Stripe.errors.StripeAuthenticationError) {
			logger.fatal(error, "Stripe authentication failed");
			return {
				error: new InternalError("Payment provider configuration error"),
				success: false,
			};
		}

		if (error instanceof Stripe.errors.StripeRateLimitError) {
			logger.error(error, "Stripe rate limit exceeded");
			return {
				error: new RateLimitError("Stripe rate limit exceeded"),
				success: false,
			};
		}

		if (error instanceof Stripe.errors.StripeConnectionError) {
			logger.error(error, "Stripe connection failed");
			return {
				error: new InternalError("Failed to connect to Stripe"),
				success: false,
			};
		}

		logger.error(
			error,
			"Unexpected error occurred while creating checkout session",
		);
		return {
			error: new InternalError(
				"Unexpected error occurred while creating checkout session",
				{
					cause: error,
				},
			),
			success: false,
		};
	}

	private _safeValidate<T>(
		schema: z.ZodSchema<T>,
		params: unknown,
		logger: Logger,
	): PaymentResult<T> {
		const result = schema.safeParse(params);

		if (!result.success) {
			const formattedZodErrorsMessage = formatZodErrors(result.error);
			logger.warn(
				{ error: result.error, params },
				`Invalid parameters: ${formattedZodErrorsMessage}`,
			);
			return {
				error: new ValidationError(
					`Invalid parameters: ${formattedZodErrorsMessage}`,
					{
						cause: result.error,
					},
				),
				success: false,
			};
		}

		return {
			data: result.data,
			success: true,
		};
	}
}
