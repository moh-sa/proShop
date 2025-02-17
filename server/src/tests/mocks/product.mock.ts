import { faker } from "@faker-js/faker";
import { Types } from "mongoose";
import { SelectProduct } from "../../types";
import { generateMockObjectId } from "./objectid.mock";

export function generateMockProduct(): SelectProduct {
  return {
    _id: new Types.ObjectId(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.int({ min: 1, max: 100 }),
    image: faker.image.urlLoremFlickr({ width: 372, height: 296 }),
    category: faker.commerce.department(),
    brand: faker.commerce.product(),
    countInStock: faker.number.int({ min: 0, max: 20 }),
    rating: 0,
    numReviews: 0,
    user: generateMockObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateMockProducts(count: number): Array<SelectProduct> {
  return faker.helpers.uniqueArray(generateMockProduct, count);
}
