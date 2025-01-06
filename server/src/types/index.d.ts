import { IUser } from "../models/userModel";

declare global {
  namespace Express {
    interface Locals {
      token: {
        id: string;
        iat: number;
        exp: number;
      };
      user: Omit<IUser, "matchPassword">;
    }
  }
}
