import { z } from "zod";

export const cacheKeySchema = z
	.string()
	.trim()
	.min(1, { error: "Cache key cannot be empty" })
	.max(250, { error: "Cache key too long" });

export const ttlSchema = z.number().positive({ error: "TTL must be positive" });

export const cacheKeysSchema = z.array(cacheKeySchema);
export const cacheValueSchema = z.unknown();

export const cacheItemSchema = z.object({
	key: cacheKeySchema,
	ttl: ttlSchema,
	val: cacheValueSchema,
});

export const cacheItemsSchema = z.array(cacheItemSchema);
