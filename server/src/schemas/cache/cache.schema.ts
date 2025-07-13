import { z } from "zod";

export const cacheKeySchema = z.string().min(1);
export const cacheKeysSchema = z.array(cacheKeySchema);
export const cacheValueSchema = z.unknown();

export const cacheSetSchema = z.object({
  key: cacheKeySchema,
  val: z.unknown().refine((val) => val !== undefined && val !== null),
  ttl: z.number(),
});

export const cacheSetManySchema = z.array(cacheSetSchema);
