import { faker } from "@faker-js/faker";

import type { InsertUser, SelectUser } from "../../types/index.js";

import { generateMockObjectId } from "./objectid.mock.js";

export function generateMockInsertUser(
	options: Partial<InsertUser> = {},
): InsertUser {
	return {
		email: faker.internet.exampleEmail().toLowerCase(),
		isAdmin: faker.datatype.boolean(),
		name: faker.person.fullName(),
		password: faker.internet.password(),
		...options,
	};
}

export function generateMockInsertUsers({
	count,
	options = {},
}: {
	count: number;
	options?: Partial<InsertUser>;
}): Array<InsertUser> {
	return faker.helpers.uniqueArray(
		() => generateMockInsertUser(options),
		count,
	);
}

export function generateMockSelectUser(
	options: Partial<SelectUser> = {},
): SelectUser {
	return {
		_id: generateMockObjectId(),
		createdAt: faker.date.recent(),
		email: faker.internet.exampleEmail().toLowerCase(),
		isAdmin: faker.datatype.boolean(),
		name: faker.person.fullName(),
		password: faker.internet.password(),
		updatedAt: faker.date.recent(),
		...options,
	};
}

export function generateMockSelectUsers({
	count,
	options = {},
}: {
	count: number;
	options?: Partial<SelectUser>;
}): Array<SelectUser> {
	return faker.helpers.uniqueArray(
		() => generateMockSelectUser(options),
		count,
	);
}
