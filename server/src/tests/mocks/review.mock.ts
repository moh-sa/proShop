import { Types } from "mongoose";
import { InsertReview, SelectReview } from "../../types";
import { mockUser1, mockUser2, mockUser3, mockUser4 } from "./user.mock";

type MockReviewType = {
  insert: InsertReview;
  select: SelectReview;
};

export const mockReview1: MockReviewType = {
  insert: {
    name: "Review 1",
    rating: 4,
    comment: "Comment 1",
    user: mockUser1.select._id,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Review 1",
    rating: 4,
    comment: "Comment 1",
    user: mockUser1.select,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockReview2: MockReviewType = {
  insert: {
    name: "Review 2",
    rating: 3,
    comment: "Comment 2",
    user: mockUser2.select._id,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Review 2",
    rating: 3,
    comment: "Comment 2",
    user: mockUser2.select,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockReview3: MockReviewType = {
  insert: {
    name: "Review 3",
    rating: 5,
    comment: "Comment 3",
    user: mockUser3.select._id,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Review 3",
    rating: 5,
    comment: "Comment 3",
    user: mockUser3.select,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockReview4: MockReviewType = {
  insert: {
    name: "Review 4",
    rating: 2,
    comment: "Comment 4",
    user: mockUser4.select._id,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Review 4",
    rating: 2,
    comment: "Comment 4",
    user: mockUser4.select,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockReview5: MockReviewType = {
  insert: {
    name: "Review 5",
    rating: 1,
    comment: "Comment 5",
    user: mockUser1.select._id,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Review 5",
    rating: 1,
    comment: "Comment 5",
    user: mockUser1.select,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockReview6: MockReviewType = {
  insert: {
    name: "Review 6",
    rating: 4,
    comment: "Comment 6",
    user: mockUser2.select._id,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Review 6",
    rating: 4,
    comment: "Comment 6",
    user: mockUser2.select,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockReview7: MockReviewType = {
  insert: {
    name: "Review 7",
    rating: 3,
    comment: "Comment 7",
    user: mockUser3.select._id,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Review 7",
    rating: 3,
    comment: "Comment 7",
    user: mockUser3.select,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
