import { z } from "zod";

export const emailValidator = z
  .string()
  .min(1, { message: "Email is required." })
  .email({ message: "Invalid email format." });
