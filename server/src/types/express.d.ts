import { Types } from "mongoose";
import { TSelectUser } from "./user.type";

declare global {
  namespace Express {
    interface Locals {
      token: {
        id: Types.ObjectId;
        iat: number;
        exp: number;
      };
      user: TSelectUser;
    }
  }
}
