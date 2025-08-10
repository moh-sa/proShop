import { faker } from "@faker-js/faker";

import type { SelectUser } from "../../types/index.js";

import { generateMockObjectId } from "./objectid.mock.js";

export function generateMockUser(isAdmin = false): SelectUser {
	const mockId = generateMockObjectId();

	return {
		_id: mockId,
		createdAt: new Date(),
		email: faker.internet.exampleEmail(),
		isAdmin,
		name: faker.person.fullName(),
		password: faker.internet.password(),
		token: faker.internet.jwt({
			payload: {
				exp: faker.date.soon(),
				iat: faker.date.recent(),
				id: mockId,
			},
		}),
		updatedAt: new Date(),
	};
}

export function generateMockUsers(count: number): Array<SelectUser> {
	return faker.helpers.uniqueArray(generateMockUser, count);
}
