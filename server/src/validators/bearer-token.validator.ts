import { z } from "zod";
/**
 * Validates the auth header format. It should start with `Bearer <token>`
 */
export const bearerTokenValidator = z
  .string()
  .min(1, { message: "Authorization header is required." })
  .startsWith("Bearer ", { message: "Invalid token format." })
  .transform((val) => val.slice(7)); // Extract token part from "Bearer <token>"
