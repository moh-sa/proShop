import { mock } from "node:test";

import { faker } from "@faker-js/faker";

import type { IPaymentService } from "../../services/index.js";
import type {
	CreateCheckoutSessionParams,
	CreateCheckoutSessionResponse,
	LineItem,
} from "../../types/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockPaymentService(): FunctionMocksWithReset<IPaymentService> {
	return {
		createCheckoutSession: mock.fn(),
		verifyWebhook: mock.fn(),
		reset() {
			this.createCheckoutSession.mock.resetCalls();
			this.verifyWebhook.mock.resetCalls();

			this.createCheckoutSession.mock.restore();
			this.verifyWebhook.mock.restore();
		},
	};
}

export function generateMockCheckoutSessionItem(
	override: Partial<LineItem> = {},
): LineItem {
	return {
		name: faker.commerce.productName(),
		quantity: faker.number.int({ min: 1, max: 99 }),
		unitAmount: faker.number.int({ min: 100, max: 100000 }), // $1 - $1000
		...override,
	};
}

export function generateMockCheckoutSessionItems(params: {
	override?: Partial<LineItem>;
	count: number;
}): Array<LineItem> {
	return faker.helpers.uniqueArray(
		() => generateMockCheckoutSessionItem(params.override),
		params.count,
	);
}

export function generateMockCreateSessionParams(
	override: Partial<CreateCheckoutSessionParams> = {},
): CreateCheckoutSessionParams {
	return {
		cancelUrl: faker.internet.url(),
		currency: faker.finance.currencyCode().toLowerCase(),
		orderId: faker.database.mongodbObjectId(),
		userEmail: faker.internet.email().toLowerCase(),
		successUrl: faker.internet.url(),
		items: generateMockCheckoutSessionItems({
			count: faker.number.int({ min: 1, max: 5 }),
		}),
		...override,
	};
}
export function generateMockCheckoutSessionResponse(
	override: Partial<CreateCheckoutSessionResponse> = {},
): CreateCheckoutSessionResponse {
	return {
		id: override.id ?? `cs_${faker.string.alphanumeric(24)}`,
		url: override.url ?? faker.internet.url(),
	};
}
