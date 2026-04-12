import { faker } from "@faker-js/faker";

import type { CreateReview, Review } from "../../types/index.js";

import { generateMockObjectId } from "./objectid.mock.js";

export function generateMockInsertReview(
	options: Partial<CreateReview> = {},
): CreateReview {
	return {
		comment: faker.lorem.sentence(),
		name: faker.internet.username(),
		product: generateMockObjectId(),
		rating: faker.number.int({ max: 5, min: 1 }),
		user: generateMockObjectId(),
		...options,
	};
}

export function generateMockInsertReviews({
	count,
	options = {},
}: {
	count: number;
	options?: Partial<CreateReview>;
}): Array<CreateReview> {
	return faker.helpers.uniqueArray(
		() => generateMockInsertReview(options),
		count,
	);
}

export function generateMockSelectReview(
	options: Partial<Review> = {},
): Review {
	return {
		_id: generateMockObjectId(),
		comment: faker.lorem.sentence(),
		createdAt: new Date(),
		name: faker.internet.username(),
		product: generateMockObjectId(),
		rating: faker.number.int({ max: 5, min: 1 }),
		updatedAt: new Date(),
		user: generateMockObjectId(),
		...options,
	};
}

export function generateMockSelectReviews({
	count = 1,
	options = {},
}: {
	count?: number;
	options?: Partial<Review>;
} = {}): Array<Review> {
	return faker.helpers.uniqueArray(
		() => generateMockSelectReview(options),
		count,
	);
}
