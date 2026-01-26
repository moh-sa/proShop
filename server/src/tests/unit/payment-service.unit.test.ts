import assert from "node:assert";
import { beforeEach, describe, it, suite } from "node:test";
import { PAYMENT_MIN_USD_CHARGE } from "../../constants";
import { InternalError, ValidationError } from "../../errors";
import { PaymentService } from "../../services";
import {
	generateMockCheckoutSessionItem,
	generateMockCreateSessionParams,
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
							images: [mockItem.imageUrl],
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
});
