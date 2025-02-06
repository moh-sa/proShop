import { Types } from "mongoose";
import { InsertProduct, SelectProduct } from "../../types";
import {
  mockReview1,
  mockReview2,
  mockReview3,
  mockReview4,
  mockReview5,
  mockReview6,
  mockReview7,
} from "./review.mock";
import { mockUser1, mockUser2, mockUser3, mockUser4 } from "./user.mock";

type MockProductType = {
  insert: InsertProduct;
  select: SelectProduct;
};

export const mockProduct1: MockProductType = {
  insert: {
    name: "Product 1",
    description: "Description 1",
    price: 100,
    image: "image1.jpg",
    category: "Category 1",
    user: mockUser1.select._id,
    brand: "Brand 1",
    countInStock: 10,
    rating: 4,
    numReviews: 0,
    reviews: [],
  },
  select: {
    name: "Product 1",
    description: "Description 1",
    price: 100,
    image: "image1.jpg",
    category: "Category 1",
    user: mockUser1.select,
    brand: "Brand 1",
    countInStock: 10,
    rating: 4,
    numReviews: 2,
    reviews: [mockReview1.select, mockReview2.select],
    _id: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockProduct2: MockProductType = {
  insert: {
    name: "Product 2",
    description: "Description 2",
    price: 100,
    image: "image2.jpg",
    category: "Category 2",
    user: mockUser2.select._id,
    brand: "Brand 2",
    countInStock: 5,
    rating: 2,
    numReviews: 0,
    reviews: [],
  },
  select: {
    name: "Product 2",
    description: "Description 2",
    price: 100,
    image: "image2.jpg",
    category: "Category 2",
    user: mockUser2.select,
    brand: "Brand 2",
    countInStock: 5,
    rating: 2,
    numReviews: 1,
    reviews: [mockReview3.select],
    _id: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockProduct3: MockProductType = {
  insert: {
    name: "Product 3",
    description: "Description 3",
    price: 100,
    image: "image3.jpg",
    category: "Category 3",
    user: mockUser3.select._id,
    brand: "Brand 3",
    countInStock: 12,
    rating: 5,
    numReviews: 0,
    reviews: [],
  },
  select: {
    name: "Product 3",
    description: "Description 3",
    price: 100,
    image: "image3.jpg",
    category: "Category 3",
    user: mockUser3.select,
    brand: "Brand 3",
    countInStock: 12,
    rating: 5,
    numReviews: 3,
    reviews: [mockReview4.select, mockReview5.select, mockReview6.select],
    _id: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockProduct4: MockProductType = {
  insert: {
    name: "Product 4",
    description: "Description 4",
    price: 100,
    image: "image4.jpg",
    category: "Category 4",
    user: mockUser4.select._id,
    brand: "Brand 4",
    countInStock: 99,
    rating: 3,
    numReviews: 0,
    reviews: [],
  },
  select: {
    name: "Product 4",
    description: "Description 4",
    price: 100,
    image: "image4.jpg",
    category: "Category 4",
    user: mockUser4.select,
    brand: "Brand 4",
    countInStock: 99,
    rating: 3,
    numReviews: 2,
    reviews: [mockReview7.select, mockReview1.select],
    _id: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
