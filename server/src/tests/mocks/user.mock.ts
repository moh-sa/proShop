import { faker } from "@faker-js/faker";
import { SelectUser } from "../../types";
import { generateMockObjectId } from "./objectid.mock";

export function generateMockUser(isAdmin = false): SelectUser {
  const mockId = generateMockObjectId();

  return {
    _id: mockId,
    name: faker.person.fullName(),
    email: faker.internet.exampleEmail(),
    password: faker.internet.password(),
    isAdmin,
    createdAt: new Date(),
    updatedAt: new Date(),
    token: faker.internet.jwt({
      payload: {
        id: mockId,
        iat: faker.date.recent(),
        exp: faker.date.soon(),
      },
    }),
  };
}

export function generateMockUsers(count: number): Array<SelectUser> {
  return faker.helpers.uniqueArray(generateMockUser, count);
}
