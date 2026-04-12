import { faker } from "@faker-js/faker";

import type { CreateUser, User } from "../../types/index.js";

import { generateMockObjectId } from "./objectid.mock.js";

export function generateMockInsertUser(
	options: Partial<CreateUser> = {},
): CreateUser {
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
	options?: Partial<CreateUser>;
}): Array<CreateUser> {
	return faker.helpers.uniqueArray(
		() => generateMockInsertUser(options),
		count,
	);
}

export function generateMockSelectUser(options: Partial<User> = {}): User {
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
	options?: Partial<User>;
}): Array<User> {
	return faker.helpers.uniqueArray(
		() => generateMockSelectUser(options),
		count,
	);
}
