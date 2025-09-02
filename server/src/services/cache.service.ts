import type { z } from "zod";

import NodeCache from "node-cache";

import type {
	CacheConfig,
	CacheFailureResult,
	CacheItem,
	CacheItems,
	CacheResult,
	CacheStats,
	CacheSuccessResult,
	Namespace,
} from "../types/index.js";

import { DEFAULT_CACHE_CONFIG, MAX_CACHE_SIZE } from "../config/index.js";
import {
	CacheCapacityError,
	CacheOperationError,
	CacheValidationError,
} from "../errors/index.js";
import {
	cacheItemSchema,
	cacheItemsSchema,
	cacheKeySchema,
	cacheKeysSchema,
} from "../schemas/index.js";
import { formatZodErrors } from "../utils/index.js";

export interface ICacheService {
	delete(args: { key: string }): CacheResult;
	deleteMany(args: { keys: Array<string> }): Array<CacheResult>;
	flush(): void;
	flushStats(): void;
	get<T>(args: { key: string }): CacheResult<T>;
	getKeys(): Array<string>;
	getMany<T>(args: { keys: Array<string> }): Array<CacheResult<T>>;
	getStats(): CacheStats;
	isKeyCached(args: { key: string }): CacheResult;
	set(args: CacheItem): CacheResult;
	setMany(args: CacheItems): Array<CacheResult>;
	take<T>(args: { key: string }): CacheResult<T>;
}

export class CacheService implements ICacheService {
	private _cache: NodeCache;
	private readonly _namespace: Namespace;

	constructor(namespace: Namespace, config?: Partial<CacheConfig>) {
		this._namespace = namespace;
		this._cache = new NodeCache({
			...DEFAULT_CACHE_CONFIG,
			...config,
		});
	}

	delete(args: { key: string }): CacheResult {
		const parsedKey = this._validateSchema({
			data: args.key,
			schema: cacheKeySchema,
		});

		const key = this._generateCacheKey({ id: parsedKey });

		try {
			const result = this._cache.del(key) === 0 ? false : true;

			return result
				? this._createSuccessResult(key)
				: this._createFailureResult(key, CacheOperationError.delete(key));
		} catch (error) {
			return this._createFailureResult(
				key,
				CacheOperationError.delete(key, error),
			);
		}
	}

	deleteMany(args: { keys: Array<string> }): Array<CacheResult> {
		const parsedKeys = this._validateSchema({
			data: args.keys,
			schema: cacheKeysSchema,
		});

		return parsedKeys.map((key) => {
			const cacheKey = this._generateCacheKey({ id: key });

			try {
				const result = this._cache.del(cacheKey) === 0 ? false : true;

				return result
					? this._createSuccessResult(key)
					: this._createFailureResult(key, CacheOperationError.delete(key));
			} catch (error) {
				return this._createFailureResult(
					key,
					CacheOperationError.delete(key, error),
				);
			}
		});
	}

	flush(): void {
		try {
			this._cache.flushAll();
		} catch (error) {
			console.error("Failed to flush cache");
			throw CacheOperationError.flush(error);
		}
	}

	flushStats(): void {
		this._cache.flushStats();
	}

	get<T>(args: { key: string }): CacheResult<T> {
		const parsedKey = this._validateSchema({
			data: args.key,
			schema: cacheKeySchema,
		});
		const key = this._generateCacheKey({ id: parsedKey });

		try {
			const result = this._cache.get<T>(key);
			if (!result) {
				console.error("Cache miss:", args.key);
				return this._createFailureResult(key, CacheOperationError.get(key));
			}

			console.warn("Cache hit:", args.key);
			return this._createSuccessResult(result);
		} catch (error) {
			console.error("Failed to get key", key);
			return this._createFailureResult(
				key,
				CacheOperationError.get(key, error),
			);
		}
	}

	getKeys(): Array<string> {
		return this._cache.keys();
	}

	getMany<T>(args: { keys: Array<string> }): Array<CacheResult<T>> {
		const parsedKeys = this._validateSchema({
			data: args.keys,
			schema: cacheKeysSchema,
		});

		return parsedKeys.map((item) => {
			const key = this._generateCacheKey({ id: item });

			try {
				const result = this._cache.get<T>(key);

				return result
					? this._createSuccessResult(result)
					: this._createFailureResult(key, CacheOperationError.get(key));
			} catch (error) {
				return this._createFailureResult(
					key,
					CacheOperationError.get(key, error),
				);
			}
		});
	}

	getStats(): CacheStats {
		const stats = this._cache.getStats();
		return {
			hits: stats.hits,
			keysSize: stats.ksize,
			misses: stats.misses,
			numberOfKeys: stats.keys,
			totalSize: stats.vsize + stats.ksize,
			valuesSize: stats.vsize,
		};
	}

	isKeyCached(args: { key: string }): CacheResult {
		const parsedKey = this._validateSchema({
			data: args.key,
			schema: cacheKeySchema,
		});

		const key = this._generateCacheKey({ id: parsedKey });
		try {
			const result = this._cache.has(key);
			if (!result) {
				return this._createFailureResult(key, CacheOperationError.has(key));
			}

			return this._createSuccessResult(key);
		} catch (error) {
			console.error("Failed to check if key is cached", key);
			return this._createFailureResult(
				key,
				CacheOperationError.has(key, error),
			);
		}
	}

	set(args: CacheItem): CacheResult {
		const parsedArgs = this._validateSchema({
			data: {
				key: args.key,
				ttl: args.ttl ?? DEFAULT_CACHE_CONFIG.stdTTL,
				val: args.value,
			},
			schema: cacheItemSchema,
		});

		this._validateMemoryCapacity(1);

		const key = this._generateCacheKey({ id: parsedArgs.key });

		try {
			const result = this._cache.set(key, parsedArgs.val, parsedArgs.ttl);
			if (!result) {
				console.error("Failed to set key", key);
				return this._createFailureResult(key, CacheOperationError.set(key));
			}

			return this._createSuccessResult(key);
		} catch (error) {
			console.error("Failed to set key", key);
			return this._createFailureResult(
				key,
				CacheOperationError.set(key, error),
			);
		}
	}

	setMany(args: CacheItems): Array<CacheResult> {
		this._validateMemoryCapacity(args.length);

		const parsedArgs = this._validateSchema({
			data: args.map((arg) => ({
				key: arg.key,
				ttl: arg.ttl ?? DEFAULT_CACHE_CONFIG.stdTTL,
				val: arg.value,
			})),
			schema: cacheItemsSchema,
		});

		const parsedArgsWithCacheKeys = parsedArgs.map((arg) => ({
			...arg,
			key: this._generateCacheKey({ id: arg.key }),
		}));

		return parsedArgsWithCacheKeys.map((arg) => {
			try {
				const result = this._cache.set(arg.key, arg.val, arg.ttl);
				if (!result) {
					console.error("Failed to set key", arg.key);
					return this._createFailureResult(
						arg.key,
						CacheOperationError.set(arg.key),
					);
				}

				return this._createSuccessResult(arg.key);
			} catch (error) {
				console.error("Failed to set key", arg.key);
				return this._createFailureResult(
					arg.key,
					CacheOperationError.set(arg.key, error),
				);
			}
		});
	}

	take<T>(args: { key: string }): CacheResult<T> {
		const parsedKey = this._validateSchema({
			data: args.key,
			schema: cacheKeySchema,
		});

		const key = this._generateCacheKey({ id: parsedKey });

		try {
			const result = this._cache.take<T>(key);
			if (!result) {
				console.warn("Cache miss:", args.key);
				return this._createFailureResult(key, CacheOperationError.take(key));
			}

			return this._createSuccessResult(result);
		} catch (error) {
			console.error("Failed to take key", key);
			return this._createFailureResult(
				key,
				CacheOperationError.take(key, error),
			);
		}
	}

	private _createFailureResult<T, E = Error>(
		key: T,
		error: E,
	): CacheFailureResult<T, E> {
		return {
			error,
			key,
			success: false,
		};
	}

	private _createSuccessResult<T>(data: T): CacheSuccessResult<T> {
		return {
			data,
			success: true,
		};
	}

	private _generateCacheKey({ id }: { id: string }): string {
		return `${this._namespace}:${id}`;
	}

	private _validateMemoryCapacity(batchSize: number): void {
		if (batchSize === 0) {
			return;
		}
		if (batchSize > MAX_CACHE_SIZE) {
			throw CacheCapacityError.batchTooLarge(batchSize, MAX_CACHE_SIZE);
		}

		const currentKeys = this._cache.keys();
		const usedCacheSpace = currentKeys.length;
		if (usedCacheSpace === 0) {
			return;
		}

		const availableSpace = MAX_CACHE_SIZE - usedCacheSpace;
		if (availableSpace > batchSize) {
			return;
		}

		const spaceNeeded = batchSize - availableSpace;
		const fallbackSpace = Math.ceil(usedCacheSpace * 0.1); // 10% of current keys size
		const keysToDeleteCount = Math.max(spaceNeeded, fallbackSpace);

		// NodeCache doesn't support LRU (least recently used)
		// so we sort by TTL and delete the oldest keys
		const keysByTTL = currentKeys
			.map((key) => ({
				key,
				ttl: this._cache.getTtl(key) ?? DEFAULT_CACHE_CONFIG.stdTTL,
			}))
			.sort((a, b) => a.ttl - b.ttl)
			.map((entity) => entity.key);

		const keysToDelete = keysByTTL.slice(0, keysToDeleteCount);

		try {
			this._cache.del(keysToDelete);
			console.warn(`[Cache] Deleted ${keysToDelete.length} keys`, keysToDelete);
		} catch (error) {
			console.error("Failed to delete keys", keysToDelete);
			throw CacheOperationError.delete(keysToDelete, error);
		}
	}

	private _validateSchema<T extends z.ZodType>(args: {
		data: z.infer<T>;
		schema: T;
	}): z.infer<T> {
		const parsed = args.schema.safeParse(args.data);
		if (!parsed.success) {
			const paths = parsed.error.issues.map((issue) => issue.path.join("."));

			if (paths.includes("key")) {
				throw CacheValidationError.invalidKey(String(args.data));
			}

			if (paths.includes("ttl")) {
				throw CacheValidationError.invalidTTL(Number(args.data));
			}

			throw new CacheValidationError(formatZodErrors(parsed.error));
		}

		return parsed.data;
	}
}
