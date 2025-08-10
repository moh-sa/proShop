import type { SignOptions } from "jsonwebtoken";

export const jwtSignOptions: SignOptions = {
  expiresIn: "30d",
};
