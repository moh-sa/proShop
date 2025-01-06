import { TSelectUser } from "./user.type";

declare global {
  namespace Express {
    interface Locals {
      token: {
        id: string;
        iat: number;
        exp: number;
      };
      user: TSelectUser;
    }
  }
}
