import { faker } from "@faker-js/faker";

import type {
	CreateProductInput,
	CreateProductUploadInput,
	Product,
} from "../../types/index.js";
import { mockMulterImageFile } from "./image.mock.js";
import { generateMockObjectId } from "./objectid.mock.js";

export function generateMockInsertProducts({
	count,
}: {
	count: number;
}): Array<CreateProductUploadInput> {
	return faker.helpers.uniqueArray(
		generateMockInsertProductWithMulterImage,
		count,
	);
}

export function generateMockInsertProductsWithStringImage({
	count,
}: {
	count: number;
}): Array<CreateProductInput> {
	return faker.helpers.uniqueArray(
		() => generateMockInsertProductWithStringImage(),
		count,
	);
}

export function generateMockInsertProductWithMulterImage(): CreateProductUploadInput {
	const mockProduct = generateMockInsertProduct();
	const mockMulterImage = mockMulterImageFile();
	return {
		...mockProduct,
		image: mockMulterImage,
	};
}

export function generateMockInsertProductWithStringImage(): CreateProductInput {
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
		userId: generateMockObjectId(),
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

function generateMockInsertProduct(): Omit<CreateProductUploadInput, "image"> {
	const mockProduct = baseMockProduct();
	return {
		...mockProduct,
		userId: generateMockObjectId(),
	};
}
