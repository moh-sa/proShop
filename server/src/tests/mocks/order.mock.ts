import { faker } from "@faker-js/faker";
import { Types } from "mongoose";

import type {
	InsertOrder,
	InsertOrderItem,
	OrderStatus,
	SelectOrder,
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

type GenerateOrderItemOptions = Partial<InsertOrderItem>;

type GeneratePaymentResultOptions = Partial<InsertOrder["payment"]>;

type GenerateShippingAddressOptions = Partial<InsertOrder["shippingAddress"]>;

// Specific options for insert and select orders
type GenerateInsertOrderOptions = InsertOrder & { orderItemsCount?: number };
type GenerateSelectOrderOptions = SelectOrder & { orderItemsCount?: number };

// Helper functions
function generateMockOrderItem(
	options: GenerateOrderItemOptions = {},
): InsertOrder["orderItems"][number] {
	const mockProduct = generateMockSelectProduct();

	return {
		image: options.image ?? mockProduct.image,
		name: options.name ?? mockProduct.name,
		price: options.price ?? mockProduct.price,
		product: options.product ?? mockProduct._id,
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
): InsertOrder["orderItems"] {
	return Array.from({ length: count }, () =>
		generateMockOrderItem(itemOptions),
	);
}

function generateMockPayment(
	options: GeneratePaymentResultOptions = {},
): InsertOrder["payment"] {
	return {
		id: options.id ?? faker.string.uuid(),
		provider:
			options.provider ??
			faker.helpers.arrayElement(MOCK_DATA_CONSTANTS.PAYMENT_METHODS),
	};
}

function generateMockShippingAddress(
	options: GenerateShippingAddressOptions = {},
): InsertOrder["shippingAddress"] {
	return {
		address: options.address ?? faker.location.streetAddress(),
		city: options.city ?? faker.location.city(),
		country: options.country ?? faker.location.country(),
		postalCode: options.postalCode ?? faker.location.zipCode(),
	};
}

function generateMockUser(): InsertOrder["user"] {
	return {
		_id: generateMockObjectId(),
		email: faker.internet.exampleEmail().toLowerCase(),
		name: faker.person.fullName(),
	};
}

// Main generation functions
export function generateMockInsertOrder(
	options: Partial<GenerateInsertOrderOptions> = {},
): InsertOrder {
	const orderItems = options.orderItems
		? options.orderItems.map((item) => generateMockOrderItem(item))
		: generateMockOrderItems(
				options.orderItemsCount ??
					faker.number.int({
						max: MOCK_DATA_CONSTANTS.ORDER_ITEMS.MAX_COUNT,
						min: MOCK_DATA_CONSTANTS.ORDER_ITEMS.MIN_COUNT,
					}),
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

	const paidAt = isPaidStatus
		? (options.paidAt ?? faker.date.recent())
		: undefined;
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
		paidAt,
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
): Array<InsertOrder> {
	return faker.helpers.uniqueArray(
		() => generateMockInsertOrder(options),
		count,
	);
}

export function generateMockSelectOrder(
	options: Partial<GenerateSelectOrderOptions> = {},
): SelectOrder {
	const mockUser = options.user ?? generateMockUser();

	const baseOrder = generateMockInsertOrder({
		...options,
		user: mockUser,
	});

	return {
		...baseOrder,
		_id: options._id ?? new Types.ObjectId(),
		createdAt: options.createdAt ?? faker.date.recent(),
		updatedAt: options.updatedAt ?? faker.date.recent(),
	};
}

export function generateMockSelectOrders(
	count: number,
	options: Partial<GenerateSelectOrderOptions> = {},
): Array<SelectOrder> {
	return faker.helpers.uniqueArray(
		() => generateMockSelectOrder(options),
		count,
	);
}
