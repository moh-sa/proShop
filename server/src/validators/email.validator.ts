import { z } from "zod";

export const emailValidator = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { message: "Email is required." })
  .email({ message: "Invalid email format." });
