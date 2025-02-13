import { faker } from "@faker-js/faker";
import { Types } from "mongoose";

export function generateMockOrder() {
  const itemsPrice = faker.number.int({ min: 1, max: 100 });
  const shippingPrice = faker.number.int({ min: 5, max: 50 });
  const taxPrice = itemsPrice * 0.1; // 10% tax
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  const isPaid = faker.datatype.boolean();
  const isDelivered = faker.datatype.boolean();

  return {
    _id: new Types.ObjectId(),
    user: new Types.ObjectId(),
    shippingAddress: {
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      postalCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    paymentMethod: faker.helpers.arrayElement(["PayPal", "Stripe"]),
    paymentResult: {
      id: faker.database.mongodbObjectId(),
      status: faker.helpers.arrayElement(["completed", "pending", "failed"]),
      update_time: faker.date.recent(),
      email_address: faker.internet.email(),
    },
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    isPaid,
    paidAt: isPaid ? faker.date.recent() : undefined,
    isDelivered,
    deliveredAt: isDelivered ? faker.date.recent() : undefined,
    orderItems: Array.from(
      { length: faker.number.int({ min: 1, max: 5 }) },
      () => {
        return {
          name: faker.commerce.productName(),
          image: faker.image.urlLoremFlickr(),
          price: faker.number.int({ min: 1, max: 100 }),
          qty: faker.number.int({ min: 1, max: 10 }),
          product: new Types.ObjectId(),
        };
      },
    ),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
}


export function generateMockOrders(count: number) {
  return faker.helpers.uniqueArray(generateMockOrder, count);
}
