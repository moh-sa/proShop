import type { IOrderService, IPaymentService } from "../services/index.js";
import type {
	AllOrdersResponse,
	CreateOrderResponse,
	InsertOrder,
	LineItem,
	MethodParams,
	MethodReturn,
	OrderPaginationParams,
	PaginatedResponse,
	Result,
	SelectOrder,
	SelectOrderItem,
	VerifyWebhookParams,
} from "../types/index.js";

import { OrderService, PaymentService } from "../services/index.js";
import { frontendUrlBuilder, getLoggerFromContext } from "../utils/index.js";

export interface IOrderManager {
	/**
	 * Creates a new order and initiates a Stripe checkout session.
	 *
	 * @returns The created order and checkout URL for redirecting the user
	 */
	create(params: InsertOrder): Promise<OrderManagerResult<CreateOrderResponse>>;

	/**
	 * Gets all orders with pagination and filtering
	 */
	getAll(
		params: OrderPaginationParams,
	): Promise<OrderManagerResult<PaginatedResponse<AllOrdersResponse>>>;

	/**
	 * Gets an order by its ID
	 */
	getById(params: {
		orderId: string;
	}): Promise<OrderManagerResult<SelectOrder>>;

	/**
	 * Processes Stripe webhook events for checkout sessions.
	 *
	 * Handles:
	 * - `checkout.session.completed`: Updates order status to "processing"
	 * - `checkout.session.expired`: Updates order status to "cancelled"
	 */
	processPaymentWebhook(
		params: VerifyWebhookParams,
	): Promise<OrderManagerResult<void>>;

	/**
	 * Updates the payment of an order
	 */
	updatePayment(
		params: Partial<SelectOrder["payment"]> & { orderId: string },
	): Promise<OrderManagerResult<SelectOrder>>;
}

type OrderManagerResult<T> = Result<T>;

export class OrderManager implements IOrderManager {
	private readonly _orderService: IOrderService;
	private readonly _paymentService: IPaymentService;

	constructor(
		orderService: IOrderService = new OrderService(),
		paymentService: IPaymentService = new PaymentService(),
	) {
		this._orderService = orderService;
		this._paymentService = paymentService;
	}

	async create(
		params: MethodParams<IOrderManager, "create">,
	): MethodReturn<IOrderManager, "create"> {
		const logger = this._getLogger({ method: "create" });
		logger.debug({ data: params }, "Creating order with checkout session");

		// Create the order
		const orderResult = await this._orderService.create(params);
		if (!orderResult.success) {
			return orderResult;
		}

		const orderId = orderResult.data._id.toString();

		logger.info(
			{
				orderId,
				totalPrice: orderResult.data.totalPrice,
				userEmail: orderResult.data.user.email,
				userId: orderResult.data.user._id,
			},
			"Order created successfully",
		);

		// Transform order items to checkout line items
		const lineItems = this._transformToLineItems(orderResult.data.orderItems);
		logger.debug(
			{ lineItems },
			"Transformed order items to checkout line items",
		);

		// Build checkout URLs
		const successUrl = frontendUrlBuilder.checkoutSuccess({ orderId });
		const cancelUrl = frontendUrlBuilder.checkoutFailure({ orderId });
		logger.debug({ cancelUrl, successUrl }, "Built checkout URLs");

		// Create checkout session
		const checkoutResult = await this._paymentService.createCheckoutSession({
			cancelUrl,
			currency: "usd",
			items: lineItems,
			orderId,
			successUrl,
			userEmail: orderResult.data.user.email,
		});

		if (!checkoutResult.success) {
			logger.error(
				{ error: checkoutResult.error, orderId },
				"Failed to create checkout session",
			);
			return checkoutResult;
		}

		logger.debug(checkoutResult.data, "Checkout session created successfully");

		// store the checkout session ID and URL
		const storeSessionResult = await this._orderService.updatePayment({
			id: checkoutResult.data.id,
			orderId,
			provider: "stripe",
			sessionURL: checkoutResult.data.url,
		});
		if (!storeSessionResult.success) {
			logger.error(
				{ error: storeSessionResult.error, orderId },
				"Failed to store checkout session details",
			);
		} else {
			logger.debug(
				storeSessionResult.data,
				"Checkout session stored successfully",
			);
		}

		logger.info(
			{ checkoutSessionId: checkoutResult.data.id, orderId },
			"Checkout session created successfully",
		);

		return {
			data: {
				order: orderResult.data,
				session: {
					url: checkoutResult.data.url,
				},
			},
			success: true,
		};
	}

	async getAll(
		params: MethodParams<IOrderManager, "getAll">,
	): MethodReturn<IOrderManager, "getAll"> {
		return this._orderService.getAll(params);
	}

	async getById(
		params: MethodParams<IOrderManager, "getById">,
	): MethodReturn<IOrderManager, "getById"> {
		return this._orderService.getById(params);
	}

	async processPaymentWebhook(
		params: MethodParams<IOrderManager, "processPaymentWebhook">,
	): MethodReturn<IOrderManager, "processPaymentWebhook"> {
		const logger = this._getLogger({ method: "processPaymentWebhook" });
		logger.debug("Processing payment provider webhook");

		// Verify the webhook signature and extract event data
		const verifyResult = this._paymentService.verifyWebhook(params);
		if (!verifyResult.success) {
			return verifyResult;
		}

		const { metadata, type: eventType } = verifyResult.data;
		const orderId = metadata.orderId;

		logger.debug({ eventType, orderId }, "Webhook verified successfully");

		switch (eventType) {
			case "checkout.session.completed": {
				const result = await this._orderService.markAsProcessing({
					orderId,
					paidAt: verifyResult.data.paidAt,
				});

				if (!result.success) {
					logger.error(
						{ error: result.error },
						"Failed to mark order as processing",
					);
					return result;
				}

				logger.info({ orderId }, "Order marked as processing successfully");

				return { data: undefined, success: true };
			}

			case "checkout.session.expired": {
				const result = await this._orderService.markAsCancelled({
					orderId,
				});
				if (!result.success) {
					logger.error(
						{ error: result.error },
						"Failed to mark order as cancelled",
					);
					return result;
				}

				logger.info({ orderId }, "Order marked as cancelled successfully");

				return { data: undefined, success: true };
			}

			default: {
				logger.warn({ eventType, orderId }, "Unhandled webhook event type");
				return { data: undefined, success: true };
			}
		}
	}

	async updatePayment(
		params: MethodParams<IOrderManager, "updatePayment">,
	): MethodReturn<IOrderManager, "updatePayment"> {
		return this._orderService.updatePayment(params);
	}

	private _getLogger(params: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "order manager", ...params });
	}

	/**
	 * Transforms order items to Stripe checkout line items format
	 */
	private _transformToLineItems(
		orderItems: Array<SelectOrderItem>,
	): Array<LineItem> {
		return orderItems.map((item) => ({
			name: item.name,
			quantity: item.qty,
			unitAmount: item.price,
		}));
	}
}
