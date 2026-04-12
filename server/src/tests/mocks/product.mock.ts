import { faker } from "@faker-js/faker";

import type {
	CreateProduct,
	CreateProductWithStringImage,
	Product,
} from "../../types/index.js";

import { mockMulterImageFile } from "./image.mock.js";
import { generateMockObjectId } from "./objectid.mock.js";

export function generateMockInsertProducts({
	count,
}: {
	count: number;
}): Array<CreateProduct> {
	return faker.helpers.uniqueArray(
		generateMockInsertProductWithMulterImage,
		count,
	);
}

export function generateMockInsertProductWithMulterImage(): CreateProduct {
	const mockProduct = generateMockInsertProduct();
	const mockMulterImage = mockMulterImageFile();
	return {
		...mockProduct,
		image: mockMulterImage,
	};
}

export function generateMockInsertProductWithStringImage(): CreateProductWithStringImage {
	const mockProduct = generateMockInsertProduct();
	const mockStringImage = faker.image.url();
	return {
		...mockProduct,
		image: mockStringImage,
	};
}

export function generateMockSelectProduct(): Product {
	const mockProduct = baseMockProduct();
	return {
		...mockProduct,
		createdAt: new Date(),
		id: generateMockObjectId(),
		image: faker.image.url(),
		numReviews: 0,
		rating: 0,
		updatedAt: new Date(),
		user: generateMockObjectId(),
	};
}

export function generateMockSelectProducts({
	count,
}: {
	count: number;
}): Array<Product> {
	return faker.helpers.uniqueArray(generateMockSelectProduct, count);
}

function baseMockProduct() {
	return {
		brand: faker.commerce.product(),
		category: faker.commerce.department(),
		countInStock: faker.number.int({ max: 20, min: 0 }),
		description: faker.commerce.productDescription(),
		name: faker.commerce.productName(),
		price: faker.number.int({ max: 100, min: 1 }),
	};
}

function generateMockInsertProduct(): Omit<CreateProduct, "image"> {
	const mockProduct = baseMockProduct();
	return {
		...mockProduct,
		user: generateMockObjectId(),
	};
}
