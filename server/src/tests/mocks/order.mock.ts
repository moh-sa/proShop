import { faker } from "@faker-js/faker";
import { Types } from "mongoose";

import type {
	InsertOrder,
	InsertOrderItem,
	SelectOrder,
	SelectUser,
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
	PAYMENT_METHODS: ["PayPal", "Stripe"] as const,
	PAYMENT_STATUSES: ["COMPLETED", "PENDING", "FAILED"] as const,
	PRICES: {
		MAX_SHIPPING: 50,
		MIN_SHIPPING: 0,
		TAX_RATE: 0.2,
	},
} as const;

// Base interfaces for generating mock data

type GenerateOrderItemOptions = Partial<InsertOrderItem>;

type GeneratePaymentResultOptions = Partial<InsertOrder["paymentResult"]>;

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

function generateMockPaymentResult(
	options: GeneratePaymentResultOptions = {},
): InsertOrder["paymentResult"] {
	return {
		email_address: options.email_address ?? faker.internet.email(),
		id: options.id ?? faker.string.uuid(),
		status:
			options.status ??
			faker.helpers.arrayElement(MOCK_DATA_CONSTANTS.PAYMENT_STATUSES),
		update_time: options.update_time ?? faker.date.recent(),
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

function generateMockPopulatedOrderUser(
	options: Partial<Pick<SelectUser, "_id" | "name" | "email">> = {},
): Pick<SelectUser, "_id" | "name" | "email"> {
	return {
		_id: options._id ?? generateMockObjectId(),
		email: options.email ?? faker.internet.exampleEmail().toLowerCase(),
		name: options.name ?? faker.person.fullName(),
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

	const isPaid = options.isPaid ?? faker.datatype.boolean();
	const paidAt = isPaid ? (options.paidAt ?? faker.date.recent()) : undefined;

	const isDelivered =
		options.isDelivered ?? (isPaid ? faker.datatype.boolean() : false);

	const deliveredAt = isDelivered
		? (options.deliveredAt ?? faker.date.recent())
		: undefined;

	const paymentMethod =
		options.paymentMethod ??
		faker.helpers.arrayElement(MOCK_DATA_CONSTANTS.PAYMENT_METHODS);

	const paymentResult = isPaid
		? (options.paymentResult ?? generateMockPaymentResult())
		: undefined;

	return {
		deliveredAt,
		isDelivered,
		isPaid,
		itemsPrice,
		orderItems,
		paidAt,
		paymentMethod,
		paymentResult,
		shippingAddress: options.shippingAddress ?? generateMockShippingAddress(),
		shippingPrice,
		taxPrice,
		totalPrice,
		user: options.user ?? generateMockObjectId(),
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
	const mockUser = options.user
		? {
				_id: options.user._id,
				email: options.user.email,
				name: options.user.name,
			}
		: generateMockPopulatedOrderUser();

	const baseOrder = generateMockInsertOrder({
		...options,
		user: mockUser._id,
	});

	return {
		...baseOrder,
		_id: options._id ?? new Types.ObjectId(),
		createdAt: options.createdAt ?? faker.date.recent(),
		updatedAt: options.updatedAt ?? faker.date.recent(),
		user: mockUser,
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
