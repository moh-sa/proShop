import { faker } from "@faker-js/faker";
import { Mock, mock } from "node:test";
import type Stripe from "stripe";
import { VerifyWebhookParams } from "../../types/payment.types.js";
import { FunctionMocksWithReset } from "../types/mocked.type.js";

type StripeSessionCreateFn = (
	params?: Stripe.Checkout.SessionCreateParams,
	options?: Stripe.RequestOptions,
) => Promise<Stripe.Response<Stripe.Checkout.Session>>;

type StripeConstructEventFn = (
	payload: string | Buffer,
	header: string | Buffer | string[],
	secret: string,
) => Stripe.Event;

type StripeMockedMethods = {
	checkout: {
		sessions: {
			create: Mock<StripeSessionCreateFn>;
		};
	};
	webhooks: {
		constructEvent: Mock<StripeConstructEventFn>;
	};
};

export function mockStripe(): FunctionMocksWithReset<StripeMockedMethods> {
	return {
		checkout: {
			sessions: {
				create: mock.fn(),
			},
		},
		webhooks: {
			constructEvent: mock.fn(),
		},
		reset() {
			this.checkout.sessions.create.mock.resetCalls();
			this.webhooks.constructEvent.mock.resetCalls();

			this.checkout.sessions.create.mock.restore();
			this.webhooks.constructEvent.mock.restore();
		},
	};
}

export function generateMockVerifyWebhookParams(
	override: Partial<VerifyWebhookParams> = {},
): VerifyWebhookParams {
	return {
		payload: Buffer.from(
			JSON.stringify({ type: "checkout.session.completed" }),
		),
		signature: `t=${Date.now()},v1=${faker.string.hexadecimal({ length: 64 })}`,
		...override,
	};
}

type StripeMetadata = { metadata: { orderId: string } | null };
type StripeEvents = Pick<Stripe.Event, "id" | "type" | "created"> &
	StripeMetadata;
export function generateMockStripeEvent(override: Partial<StripeEvents> = {}) {
	const orderId = faker.database.mongodbObjectId();
	const metadata =
		override.metadata === null ? undefined : (override.metadata ?? { orderId });
	return {
		id: override.id ?? `evt_${faker.string.alphanumeric(24)}`,
		type: override.type ?? "checkout.session.completed",
		created:
			override.created ?? Math.floor(faker.date.recent().getTime() / 1000),
		data: {
			object: {
				metadata,
			},
		},
	};
}
