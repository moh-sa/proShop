import { faker } from "@faker-js/faker";
import { InsertReview, SelectReview } from "../../types";
import { generateMockObjectId } from "./objectid.mock";

export function generateMockInsertReview(
  options: Partial<InsertReview> = {},
): InsertReview {
  return {
    user: generateMockObjectId(),
    product: generateMockObjectId(),
    name: faker.internet.username(),
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.sentence(),
    ...options,
  };
}

export function generateMockSelectReview(
  options: Partial<SelectReview> = {},
): SelectReview {
  return {
    _id: generateMockObjectId(),
    user: generateMockObjectId(),
    product: generateMockObjectId(),
    name: faker.internet.username(),
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.sentence(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...options,
  };
}

export function generateMockInsertReviews({
  count,
  options = {},
}: {
  count: number;
  options?: Partial<InsertReview>;
}): Array<InsertReview> {
  return faker.helpers.uniqueArray(
    () => generateMockInsertReview(options),
    count,
  );
}

export function generateMockSelectReviews({
  count = 1,
  options = {},
}: {
  count?: number;
  options?: Partial<SelectReview>;
} = {}): Array<SelectReview> {
  return faker.helpers.uniqueArray(
    () => generateMockSelectReview(options),
    count,
  );
}
