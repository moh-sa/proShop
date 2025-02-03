import { Types } from "mongoose";

export const mockUser1 = {
  insert: {
    name: "John Doe",
    email: "johndoe@example.com",
    password: "password123",
    isAdmin: false,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "John Doe",
    email: "johndoe@example.com",
    password: "password123",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockUser2 = {
  insert: {
    name: "Jane Doe",
    email: "janedoe@example.com",
    password: "password123",
    isAdmin: false,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Jane Doe",
    email: "janedoe@example.com",
    password: "password123",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockUser3 = {
  insert: {
    name: "John Smith",
    email: "johnsmith@example.com",
    password: "password123",
    isAdmin: false,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "John Smith",
    email: "johnsmith@example.com",
    password: "password123",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockUser4 = {
  insert: {
    name: "Jane Smith",
    email: "janesmith@example.com",
    password: "password123",
    isAdmin: false,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Jane Smith",
    email: "janesmith@example.com",
    password: "password123",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const mockAdminUser1 = {
  insert: {
    name: "Richard Roe",
    email: "richardroe@example.com",
    password: "password123",
    isAdmin: true,
  },
  select: {
    _id: new Types.ObjectId(),
    name: "Richard Roe",
    email: "richardroe@example.com",
    password: "password123",
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
