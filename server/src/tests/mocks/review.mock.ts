import { faker } from "@faker-js/faker";
import { Types } from "mongoose";
import { SelectReview } from "../../types";
import { generateMockObjectId } from "./objectid.mock";
import { generateMockUser } from "./user.mock";

export function generateMockReview(): SelectReview {
  const user = generateMockUser();
  const mockId = generateMockObjectId();

  return {
    _id: new Types.ObjectId(),
    user: user._id,
    product: mockId,
    name: user.name,
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.sentence(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateMockReviews(count: number): Array<SelectReview> {
  return faker.helpers.uniqueArray(generateMockReview, count);
}
