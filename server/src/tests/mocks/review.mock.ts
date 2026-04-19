import { faker } from "@faker-js/faker";

import type { CreateReview, Review } from "../../types/index.js";
import { generateMockObjectId } from "./objectid.mock.js";

function generateReviewUser(): CreateReview["user"] {
	return {
		id: generateMockObjectId(),
		name: faker.internet.username(),
	};
}

export function generateMockInsertReview(
	options: Partial<CreateReview> = {},
): CreateReview {
	return {
		comment: faker.lorem.sentence(),
		productId: generateMockObjectId(),
		rating: faker.number.int({ max: 5, min: 1 }),
		user: generateReviewUser(),
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
		id: generateMockObjectId(),
		comment: faker.lorem.sentence(),
		createdAt: new Date(),
		productId: generateMockObjectId(),
		rating: faker.number.int({ max: 5, min: 1 }),
		updatedAt: new Date(),
		user: generateReviewUser(),
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
