import { z } from "zod";

export const jwtValidator = z
  .string()
  .min(1, { message: "Token is required." })
  .jwt({ message: "Invalid jwt token format." });
