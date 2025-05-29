import { z } from "zod";

export const passwordValidator = z
  .string()
  .trim()
  .min(6, { message: "Password should be at least 6 characters long." })
  .max(128, { message: "Password should be at most 128 characters long." });
