import { Types } from "mongoose";
import { SelectReview } from "./review.type";
import { SelectUser } from "./user.type";

declare global {
  namespace Express {
    interface Locals {
      token: {
        id: Types.ObjectId;
        iat: number;
        exp: number;
      };
      user: SelectUser;
      review: SelectReview;
    }
  }
}
