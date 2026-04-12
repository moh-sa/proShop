import { faker } from "@faker-js/faker";

import type { CreateSession, Session } from "../../types/index.js";

import { generateMockObjectId } from "./objectid.mock.js";

export function generateMockInsertSession(
	options?: Partial<CreateSession>,
): CreateSession {
	return {
		expiresAt: faker.date.future(),
		revokedAt: null,
		tokenId: faker.string.uuid(),
		userId: generateMockObjectId(),
		...options,
	};
}

export function generateMockInsertSessions({
	count,
	options,
}: {
	count: number;
	options?: Partial<CreateSession>;
}): Array<CreateSession> {
	return faker.helpers.uniqueArray(
		() => generateMockInsertSession(options),
		count,
	);
}

export function generateMockSelectSession(options?: Partial<Session>): Session {
	return {
		createdAt: faker.date.recent(),
		expiresAt: faker.date.future(),
		id: generateMockObjectId(),
		revokedAt: null,
		tokenId: faker.string.uuid(),
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
	options?: Partial<Session>;
}): Array<Session> {
	return faker.helpers.uniqueArray(
		() => generateMockSelectSession(options),
		count,
	);
}
