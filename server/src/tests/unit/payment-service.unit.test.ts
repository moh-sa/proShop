import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";
import Stripe from "stripe";
import { PAYMENT_MIN_USD_CHARGE } from "../../constants";
import { InternalError, ValidationError } from "../../errors";
import { PaymentService } from "../../services";
import {
	generateMockCheckoutSessionItem,
	generateMockCreateSessionParams,
	generateMockStripeEvent,
	generateMockVerifyWebhookParams,
	mockStripe,
} from "../mocks/index.js";

suite("Payment Service 〖 Unit Tests 〗", () => {
	const mockProvider = mockStripe();
	const service = new PaymentService(mockProvider as any);

	beforeEach(() => mockProvider.reset());

	describe("createCheckoutSession", () => {
		it("Should return 'ValidationError' when items array is empty", async () => {
			// Arrange
			const data = generateMockCreateSessionParams({ items: [] });

			/// Act
			const result = await service.createCheckoutSession(data);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error instanceof ValidationError, true);
		});

		it("Should not call the 'Provider' when items array is empty", async () => {
			// Arrange
			const data = generateMockCreateSessionParams({ items: [] });

			/// Act
			await service.createCheckoutSession(data);

			// Assert
			assert.strictEqual(
				mockProvider.checkout.sessions.create.mock.callCount(),
				0,
			);
		});

		it("Should return 'ValidationError' when total amount is below minimum charge", async () => {
			// Arrange
			const mockItem = generateMockCheckoutSessionItem({
				unitAmount: PAYMENT_MIN_USD_CHARGE - 1,
				quantity: 1,
			});
			const data = generateMockCreateSessionParams({ items: [mockItem] });

			/// Act
			const result = await service.createCheckoutSession(data);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error instanceof ValidationError, true);
		});

		it("Should not call 'Provider' when total amount is below minimum charge", async () => {
			// Arrange
			const mockItem = generateMockCheckoutSessionItem({
				unitAmount: PAYMENT_MIN_USD_CHARGE - 1,
				quantity: 1,
			});
			const data = generateMockCreateSessionParams({ items: [mockItem] });

			/// Act
			await service.createCheckoutSession(data);

			// Assert
			assert.strictEqual(
				mockProvider.checkout.sessions.create.mock.callCount(),
				0,
			);
		});

		it("Should transform 'items' to 'Stripe line_items'", async () => {
			// Arrange
			const mockItem = generateMockCheckoutSessionItem();
			const data = generateMockCreateSessionParams({ items: [mockItem] });
			const expectedLineItems = [
				{
					quantity: mockItem.quantity,
					price_data: {
						currency: data.currency,
						product_data: {
							name: mockItem.name,
						},
						unit_amount: mockItem.unitAmount,
					},
				},
			];

			mockProvider.checkout.sessions.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ url: "", id: "" } as any),
			);

			/// Act
			await service.createCheckoutSession(data);

			// Assert
			const args =
				mockProvider.checkout.sessions.create.mock.calls[0].arguments[0];
			assert.deepStrictEqual(args?.line_items, expectedLineItems);
		});

		it("Should pass 'orderId' into 'meta'", async () => {
			// Arrange
			const data = generateMockCreateSessionParams();
			const metadata = {
				orderId: data.orderId,
			};

			mockProvider.checkout.sessions.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ url: "", id: "" } as any),
			);

			/// Act
			await service.createCheckoutSession(data);

			// Assert
			const args =
				mockProvider.checkout.sessions.create.mock.calls[0].arguments[0];

			assert.ok(args);
			assert.deepStrictEqual(args.metadata, metadata);
		});

		it("Should pass 'email', 'successUrl' and 'cancelUrl' to 'Provider'", async () => {
			// Arrange
			const data = generateMockCreateSessionParams();

			mockProvider.checkout.sessions.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ url: "", id: "" } as any),
			);

			/// Act
			await service.createCheckoutSession(data);

			// Assert
			const args =
				mockProvider.checkout.sessions.create.mock.calls[0].arguments[0];

			assert.strictEqual(args?.customer_email, data.userEmail);
			assert.strictEqual(args?.success_url, data.successUrl);
			assert.strictEqual(args?.cancel_url, data.cancelUrl);
		});

		it("Should return 'InternalError' when 'Provider' return no url", async () => {
			// Arrange
			const data = generateMockCreateSessionParams();

			mockProvider.checkout.sessions.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ id: "" } as any),
			);

			/// Act
			const result = await service.createCheckoutSession(data);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error instanceof InternalError, true);
		});

		it("Should return 'InternalError' when 'Provider' throws an error", async () => {
			// Arrange
			const data = generateMockCreateSessionParams();

			mockProvider.checkout.sessions.create.mock.mockImplementationOnce(() =>
				Promise.reject(new Error("Failed to create checkout session")),
			);

			// Act
			const result = await service.createCheckoutSession(data);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error instanceof InternalError, true);
		});

		it("Should return 'success' with 'session id' and 'session url'", async () => {
			// Arrange
			const data = generateMockCreateSessionParams();
			const sessionUrl = "https://google.com";
			const sessionId = "1234567890";

			mockProvider.checkout.sessions.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ url: sessionUrl, id: sessionId } as any),
			);

			/// Act
			const result = await service.createCheckoutSession(data);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.id, sessionId);
			assert.strictEqual(result.data.url, sessionUrl);
		});
	});

	describe("verifyWebhook", () => {
		it("Should call 'constructEvent' with payload, signature, and webhook secret", () => {
			// Arrange
			const params = generateMockVerifyWebhookParams();
			const mockEvent = generateMockStripeEvent();

			mockProvider.webhooks.constructEvent.mock.mockImplementationOnce(
				() => mockEvent,
			);

			// Act
			service.verifyWebhook(params);

			// Assert
			assert.strictEqual(
				mockProvider.webhooks.constructEvent.mock.callCount(),
				1,
			);

			const callArgs =
				mockProvider.webhooks.constructEvent.mock.calls[0].arguments;
			assert.strictEqual(callArgs[0], params.payload);
			assert.strictEqual(callArgs[1], params.signature);
			// Third argument is the webhook secret from env
			assert.strictEqual(typeof callArgs[2], "string");
		});

		it("Should return success with metadata and event type when event has metadata", () => {
			// Arrange
			const params = generateMockVerifyWebhookParams();
			const expectedMetadata = { orderId: "order_123456" };
			const expectedType = "checkout.session.completed" as const;
			const mockEvent = generateMockStripeEvent({
				metadata: expectedMetadata,
				type: expectedType,
			});

			mockProvider.webhooks.constructEvent.mock.mockImplementationOnce(
				() => mockEvent,
			);

			// Act
			const result = service.verifyWebhook(params);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data.metadata, expectedMetadata);
			assert.strictEqual(result.data.type, expectedType);
		});

		it("Should return 'ValidationError' when event object has no metadata property", () => {
			// Arrange
			const params = generateMockVerifyWebhookParams();
			const mockEventWithoutMetadata = generateMockStripeEvent({
				metadata: null,
			});

			mockProvider.webhooks.constructEvent.mock.mockImplementationOnce(
				() => mockEventWithoutMetadata,
			);

			// Act
			const result = service.verifyWebhook(params);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error instanceof ValidationError, true);
			assert.strictEqual(result.error.message.includes("metadata"), true);
		});

		it("Should return 'ValidationError' when signature verification fails", () => {
			// Arrange
			const params = generateMockVerifyWebhookParams();
			const signatureError = new Stripe.errors.StripeSignatureVerificationError(
				{
					message: "Invalid signature",
					type: "invalid_request_error",
				},
			);

			mockProvider.webhooks.constructEvent.mock.mockImplementationOnce(() => {
				throw signatureError;
			});

			// Act
			const result = service.verifyWebhook(params);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error instanceof ValidationError, true);
			assert.strictEqual(result.error.message.includes("signature"), true);
		});

		it("Should return 'InternalError' when unexpected error occurs", () => {
			// Arrange
			const params = generateMockVerifyWebhookParams();
			const unexpectedError = new Error("Something went wrong");

			mockProvider.webhooks.constructEvent.mock.mockImplementationOnce(() => {
				throw unexpectedError;
			});

			// Act
			const result = service.verifyWebhook(params);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error instanceof InternalError, true);
		});
	});
});
