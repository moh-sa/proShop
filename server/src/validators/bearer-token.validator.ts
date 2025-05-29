import { z } from "zod";
/**
 * Validates the auth header format. It should start with `Bearer <token>`
 */
export const bearerTokenValidator = z
  .string()
  .min(1, { message: "Authorization header is required." })
  .refine(
    (val) => val.startsWith("Bearer ") && val.slice(7).trim().length > 0,
    {
      path: ["Authorization"],
      message:
        "Invalid authorization header. It must start with 'Bearer ' followed by a token.",
    },
  )
  .transform((val) => val.slice(7).trim()); // remove "Bearer " prefix
