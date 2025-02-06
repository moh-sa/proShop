import { faker } from "@faker-js/faker";
import { Types } from "mongoose";
import { SelectReview } from "../../types";
import { generateMockUser } from "./user.mock";

export function generateMockReview(): SelectReview {
  const user = generateMockUser();

  return {
    _id: new Types.ObjectId(),
    name: user.name,
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.sentence(),
    user: user,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateMockReviews(count: number): Array<SelectReview> {
  return faker.helpers.uniqueArray(generateMockReview, count);
}
