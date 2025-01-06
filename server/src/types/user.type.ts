import { Types } from "mongoose";

interface BaseUser {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export interface TInsertUser extends BaseUser {}

export interface TSelectUser extends BaseUser {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface TUserSchema extends TSelectUser {
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}
