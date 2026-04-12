import { faker } from "@faker-js/faker";

export function generateMockObjectId(): string {
	return faker.database.mongodbObjectId();
}
