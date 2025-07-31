import { z } from "zod";

export const cacheKeySchema = z.string().min(1);
export const cacheKeysSchema = z.array(cacheKeySchema);
export const cacheValueSchema = z.unknown();

export const cacheItemSchema = z.object({
  key: cacheKeySchema,
  val: z.unknown().refine((val) => val !== undefined && val !== null),
  ttl: z.number(),
});

export const cacheItemsSchema = z.array(cacheItemSchema);
