import { z } from "zod";

export const cacheKeySchema = z
  .string()
  .trim()
  .min(1, "Cache key cannot be empty")
  .max(250, "Cache key too long");

export const ttlSchema = z.number().positive("TTL must be positive");

export const cacheKeysSchema = z.array(cacheKeySchema);
export const cacheValueSchema = z.unknown();

export const cacheItemSchema = z.object({
  key: cacheKeySchema,
  val: z.unknown().refine((val) => val !== undefined && val !== null),
  ttl: ttlSchema,
});

export const cacheItemsSchema = z.array(cacheItemSchema);
