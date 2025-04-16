import { faker } from "@faker-js/faker";
import {
  InsertProduct,
  InsertProductWithStringImage,
  SelectProduct,
} from "../../types";
import { generateMockMulterImage } from "./image.mock";
import { generateMockObjectId } from "./objectid.mock";

function baseMockProduct() {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.int({ min: 1, max: 100 }),
    category: faker.commerce.department(),
    brand: faker.commerce.product(),
    countInStock: faker.number.int({ min: 0, max: 20 }),
  };
}

function generateMockInsertProduct(): Omit<InsertProduct, "image"> {
  const mockProduct = baseMockProduct();
  return {
    ...mockProduct,
    user: generateMockObjectId(),
  };
}

export function generateMockInsertProductWithMulterImage(): InsertProduct {
  const mockProduct = generateMockInsertProduct();
  const mockMulterImage = generateMockMulterImage();
  return {
    ...mockProduct,
    image: mockMulterImage,
  };
}

export function generateMockInsertProductWithStringImage(): InsertProductWithStringImage {
  const mockProduct = generateMockInsertProduct();
  const mockStringImage = faker.image.urlLoremFlickr();
  return {
    ...mockProduct,
    image: mockStringImage,
  };
}

export function generateMockSelectProduct(): SelectProduct {
  const mockProduct = baseMockProduct();
  return {
    ...mockProduct,
    _id: generateMockObjectId(),
    user: generateMockObjectId(),
    image: faker.image.urlLoremFlickr(),
    rating: 0,
    numReviews: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateMockInsertProducts({
  count,
}: {
  count: number;
}): Array<InsertProduct> {
  return faker.helpers.uniqueArray(
    generateMockInsertProductWithMulterImage,
    count,
  );
}

export function generateMockSelectProducts({
  count,
}: {
  count: number;
}): Array<SelectProduct> {
  return faker.helpers.uniqueArray(generateMockSelectProduct, count);
}
