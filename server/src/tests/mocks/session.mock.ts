import { faker } from "@faker-js/faker";

import type { InsertSession, SelectSession } from "../../types/index.js";

import { generateMockObjectId } from "./objectid.mock.js";

export function generateMockInsertSession(
	options: Partial<InsertSession>,
): InsertSession {
	return {
		expiresAt: faker.date.future(),
		revokedAt: null,
		tokenId: faker.internet.jwt(),
		userId: generateMockObjectId(),
		...options,
	};
}

export function generateMockInsertSessions({
	count,
	options = {},
}: {
	count: number;
	options?: Partial<InsertSession>;
}): Array<InsertSession> {
	return faker.helpers.uniqueArray(
		() => generateMockInsertSession(options),
		count,
	);
}

export function generateMockSelectSession(
	options: Partial<SelectSession>,
): SelectSession {
	return {
		createdAt: faker.date.recent(),
		expiresAt: faker.date.future(),
		id: generateMockObjectId(),
		revokedAt: null,
		tokenId: faker.internet.jwt(),
		updatedAt: faker.date.recent(),
		userId: generateMockObjectId(),
		...options,
	};
}

export function generateMockSelectSessions({
	count,
	options = {},
}: {
	count: number;
	options?: Partial<SelectSession>;
}): Array<SelectSession> {
	return faker.helpers.uniqueArray(
		() => generateMockSelectSession(options),
		count,
	);
}
