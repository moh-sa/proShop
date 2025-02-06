import { faker } from "@faker-js/faker";
import { Types } from "mongoose";
import { SelectUser } from "../../types";

export function generateMockUser(isAdmin = false): SelectUser {
  return {
    _id: new Types.ObjectId(),
    name: faker.person.fullName(),
    email: faker.internet.exampleEmail(),
    password: faker.internet.password(),
    isAdmin,
    createdAt: new Date(),
    updatedAt: new Date(),
    token: faker.internet.jwt({
      payload: {
        id: new Types.ObjectId(),
        iat: faker.date.recent(),
        exp: faker.date.soon(),
      },
    }),
  };
}

export function generateMockUsers(count: number): Array<SelectUser> {
  return faker.helpers.uniqueArray(generateMockUser, count);
}
