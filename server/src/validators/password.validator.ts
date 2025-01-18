import { z } from "zod";

export const passwordValidator = z
  .string()
  .min(6, { message: "Password should be at least 6 characters long." });
