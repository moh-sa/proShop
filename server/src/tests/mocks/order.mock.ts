import { faker } from "@faker-js/faker";

import type {
	CreateOrder,
	CreateOrderItem,
	Order,
	OrderStatus,
} from "../../types/index.js";
import { generateMockObjectId } from "./objectid.mock.js";
import { generateMockSelectProduct } from "./product.mock.js";

// Constants for mock data generation
const MOCK_DATA_CONSTANTS = {
	ORDER_ITEMS: {
		MAX_COUNT: 5,
		MAX_QTY: 10,
		MIN_COUNT: 1,
		MIN_QTY: 1,
	},
	ORDER_STATUSES: ["pending", "processing", "delivered", "cancelled"] as const,
	PAYMENT_METHODS: ["stripe"] as const,
	PAYMENT_STATUSES: ["COMPLETED", "PENDING", "FAILED"] as const,
	PRICES: {
		MAX_SHIPPING: 50,
		MIN_SHIPPING: 0,
		TAX_RATE: 0.2,
	},
} as const;

// Base interfaces for generating mock data

type GenerateOrderItemOptions = Partial<CreateOrderItem>;

type GeneratePaymentResultOptions = Partial<CreateOrder["payment"]>;

type GenerateShippingAddressOptions = Partial<CreateOrder["shippingAddress"]>;

// Specific options for insert and select orders
type GenerateInsertOrderOptions = CreateOrder & { orderItemsCount?: number };
type GenerateSelectOrderOptions = Order & { orderItemsCount?: number };

// Helper functions
function generateMockOrderItem(
	options: GenerateOrderItemOptions = {},
): CreateOrder["orderItems"][number] {
	const mockProduct = generateMockSelectProduct();

	return {
		image: options.image ?? mockProduct.image,
		name: options.name ?? mockProduct.name,
		price: options.price ?? mockProduct.price,
		productId: options.productId ?? mockProduct.id,
		qty:
			options.qty ??
			faker.number.int({
				max: MOCK_DATA_CONSTANTS.ORDER_ITEMS.MAX_QTY,
				min: MOCK_DATA_CONSTANTS.ORDER_ITEMS.MIN_QTY,
			}),
	};
}

function generateMockOrderItems(
	count = 1,
	itemOptions: GenerateOrderItemOptions = {},
): CreateOrder["orderItems"] {
	return Array.from({ length: count }, () =>
		generateMockOrderItem(itemOptions),
	);
}

function generateMockPayment(
	options: GeneratePaymentResultOptions = {},
): CreateOrder["payment"] {
	return {
		id: options.id ?? faker.string.uuid(),
		paidAt: options.paidAt ?? faker.date.recent(),
		provider:
			options.provider ??
			faker.helpers.arrayElement(MOCK_DATA_CONSTANTS.PAYMENT_METHODS),
		sessionURL: options.sessionURL ?? faker.internet.url(),
	};
}

function generateMockShippingAddress(
	options: GenerateShippingAddressOptions = {},
): CreateOrder["shippingAddress"] {
	return {
		address: options.address ?? faker.location.streetAddress(),
		city: options.city ?? faker.location.city(),
		country: options.country ?? faker.location.country(),
		postalCode: options.postalCode ?? faker.location.zipCode(),
	};
}

function generateMockUser(): CreateOrder["user"] {
	return {
		email: faker.internet.exampleEmail().toLowerCase(),
		id: generateMockObjectId(),
		name: faker.person.fullName(),
	};
}

// Main generation functions
export function generateMockInsertOrder(
	options: Partial<GenerateInsertOrderOptions> = {},
): CreateOrder {
	const orderItems =
		options.orderItems ??
		generateMockOrderItems(
			options.orderItemsCount ?? faker.number.int({ max: 5, min: 1 }),
		);

	const itemsPrice =
		options.itemsPrice ??
		orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
	const shippingPrice =
		options.shippingPrice ??
		faker.number.float({
			fractionDigits: 2,
			max: MOCK_DATA_CONSTANTS.PRICES.MAX_SHIPPING,
			min: MOCK_DATA_CONSTANTS.PRICES.MIN_SHIPPING,
		});
	const taxPrice =
		options.taxPrice ??
		faker.number.float({
			fractionDigits: 2,
			max: itemsPrice * MOCK_DATA_CONSTANTS.PRICES.TAX_RATE,
			min: 0,
		});
	const totalPrice =
		options.totalPrice ?? itemsPrice + shippingPrice + taxPrice;

	const status: OrderStatus =
		options.status ??
		faker.helpers.arrayElement(MOCK_DATA_CONSTANTS.ORDER_STATUSES);

	const isPaidStatus = status === "processing" || status === "delivered";
	const isDeliveredStatus = status === "delivered";
	const deliveredAt = isDeliveredStatus
		? (options.deliveredAt ?? faker.date.recent())
		: undefined;

	const payment = isPaidStatus
		? (options.payment ?? generateMockPayment())
		: undefined;

	return {
		deliveredAt,
		itemsPrice,
		orderItems,
		payment,
		shippingAddress: options.shippingAddress ?? generateMockShippingAddress(),
		shippingPrice,
		status,
		taxPrice,
		totalPrice,
		user: options.user ?? generateMockUser(),
	};
}

export function generateMockInsertOrders(
	count: number,
	options: Partial<GenerateInsertOrderOptions> = {},
): Array<CreateOrder> {
	return faker.helpers.uniqueArray(
		() => generateMockInsertOrder(options),
		count,
	);
}

export function generateMockSelectOrder(
	options: Partial<GenerateSelectOrderOptions> = {},
): Order {
	const mockUser = options.user ?? generateMockUser();

	const baseOrder = generateMockInsertOrder({
		...options,
		user: mockUser,
	});

	return {
		...baseOrder,
		createdAt: options.createdAt ?? faker.date.recent(),
		id: options.id ?? generateMockObjectId(),
		updatedAt: options.updatedAt ?? faker.date.recent(),
	};
}

export function generateMockSelectOrders(
	count: number,
	options: Partial<GenerateSelectOrderOptions> = {},
): Array<Order> {
	return faker.helpers.uniqueArray(
		() => generateMockSelectOrder(options),
		count,
	);
}
