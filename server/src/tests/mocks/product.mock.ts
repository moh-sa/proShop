import { faker } from "@faker-js/faker";

import type {
	InsertProduct,
	InsertProductWithStringImage,
	SelectProduct,
} from "../../types/index.js";

import { mockMulterImageFile } from "./image.mock.js";
import { generateMockObjectId } from "./objectid.mock.js";

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

export function generateMockInsertProductWithMulterImage(): InsertProduct {
	const mockProduct = generateMockInsertProduct();
	const mockMulterImage = mockMulterImageFile();
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
		createdAt: new Date(),
		image: faker.image.urlLoremFlickr(),
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
}): Array<SelectProduct> {
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

function generateMockInsertProduct(): Omit<InsertProduct, "image"> {
	const mockProduct = baseMockProduct();
	return {
		...mockProduct,
		user: generateMockObjectId(),
	};
}
