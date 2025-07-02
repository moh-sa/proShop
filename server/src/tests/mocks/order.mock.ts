import { faker } from "@faker-js/faker";
import { Types } from "mongoose";
import type { InsertOrder, InsertOrderItem, SelectOrder } from "../../types";
import { generateMockObjectId } from "./objectid.mock";
import { generateMockSelectProduct } from "./product.mock";
import { generateMockUser } from "./user.mock";

// Constants for mock data generation
const MOCK_DATA_CONSTANTS = {
  ORDER_ITEMS: {
    MIN_COUNT: 1,
    MAX_COUNT: 5,
    MIN_QTY: 1,
    MAX_QTY: 10,
  },
  PRICES: {
    MIN_SHIPPING: 0,
    MAX_SHIPPING: 50,
    TAX_RATE: 0.2,
  },
  PAYMENT_METHODS: ["PayPal", "Stripe"] as const,
  PAYMENT_STATUSES: ["COMPLETED", "PENDING", "FAILED"] as const,
} as const;

// Base interfaces for generating mock data

type GenerateOrderItemOptions = Partial<InsertOrderItem>;

type GenerateShippingAddressOptions = Partial<InsertOrder["shippingAddress"]>;

type GeneratePaymentResultOptions = Partial<InsertOrder["paymentResult"]>;

// Specific options for insert and select orders
type GenerateInsertOrderOptions = InsertOrder & { orderItemsCount?: number };
type GenerateSelectOrderOptions = SelectOrder & { orderItemsCount?: number };

// Helper functions
function generateMockOrderItem(
  options: GenerateOrderItemOptions = {},
): InsertOrder["orderItems"][number] {
  const mockProduct = generateMockSelectProduct();

  return {
    product: options.product ?? mockProduct._id,
    name: options.name ?? mockProduct.name,
    image: options.image ?? mockProduct.image,
    price: options.price ?? mockProduct.price,
    qty:
      options.qty ??
      faker.number.int({
        min: MOCK_DATA_CONSTANTS.ORDER_ITEMS.MIN_QTY,
        max: MOCK_DATA_CONSTANTS.ORDER_ITEMS.MAX_QTY,
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

function generateMockShippingAddress(
  options: GenerateShippingAddressOptions = {},
): InsertOrder["shippingAddress"] {
  return {
    address: options.address ?? faker.location.streetAddress(),
    city: options.city ?? faker.location.city(),
    postalCode: options.postalCode ?? faker.location.zipCode(),
    country: options.country ?? faker.location.country(),
  };
}

function generateMockPaymentResult(
  options: GeneratePaymentResultOptions = {},
): InsertOrder["paymentResult"] {
  return {
    id: options.id ?? faker.string.uuid(),
    update_time: options.update_time ?? faker.date.recent(),
    email_address: options.email_address ?? faker.internet.email(),
    status:
      options.status ??
      faker.helpers.arrayElement(MOCK_DATA_CONSTANTS.PAYMENT_STATUSES),
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
            min: MOCK_DATA_CONSTANTS.ORDER_ITEMS.MIN_COUNT,
            max: MOCK_DATA_CONSTANTS.ORDER_ITEMS.MAX_COUNT,
          }),
      );

  const itemsPrice =
    options.itemsPrice ??
    orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingPrice =
    options.shippingPrice ??
    faker.number.float({
      min: MOCK_DATA_CONSTANTS.PRICES.MIN_SHIPPING,
      max: MOCK_DATA_CONSTANTS.PRICES.MAX_SHIPPING,
      fractionDigits: 2,
    });
  const taxPrice =
    options.taxPrice ??
    faker.number.float({
      min: 0,
      max: itemsPrice * MOCK_DATA_CONSTANTS.PRICES.TAX_RATE,
      fractionDigits: 2,
    });
  const totalPrice =
    options.totalPrice ?? itemsPrice + shippingPrice + taxPrice;

  const isPaid = options.isPaid ?? faker.datatype.boolean();
  const paidAt = isPaid ? options.paidAt ?? faker.date.recent() : undefined;

  const isDelivered =
    options.isDelivered ?? (isPaid ? faker.datatype.boolean() : false);

  const deliveredAt = isDelivered
    ? options.deliveredAt ?? faker.date.recent()
    : undefined;

  const paymentMethod =
    options.paymentMethod ??
    faker.helpers.arrayElement(MOCK_DATA_CONSTANTS.PAYMENT_METHODS);

  const paymentResult = isPaid
    ? options.paymentResult ?? generateMockPaymentResult()
    : undefined;

  return {
    user: options.user ?? generateMockObjectId(),
    orderItems,
    shippingAddress: options.shippingAddress ?? generateMockShippingAddress(),
    paymentMethod,
    paymentResult,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
  };
}

export function generateMockSelectOrder(
  options: Partial<GenerateSelectOrderOptions> = {},
): SelectOrder {
  const mockUser = options.user ?? generateMockUser();
  const baseOrder = generateMockInsertOrder({
    ...options,
    user: mockUser._id,
  });

  return {
    ...baseOrder,
    _id: options._id ?? new Types.ObjectId(),
    user: mockUser,
    createdAt: options.createdAt ?? faker.date.recent(),
    updatedAt: options.updatedAt ?? faker.date.recent(),
  };
}

export function generateMockInsertOrders(
  count: number,
  options: Partial<GenerateInsertOrderOptions> = {},
): InsertOrder[] {
  return faker.helpers.uniqueArray(
    () => generateMockInsertOrder(options),
    count,
  );
}

export function generateMockSelectOrders(
  count: number,
  options: Partial<GenerateSelectOrderOptions> = {},
): SelectOrder[] {
  return faker.helpers.uniqueArray(
    () => generateMockSelectOrder(options),
    count,
  );
}
