import NodeCache from "node-cache";
import type { z } from "zod";

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
import type {
	CacheConfig,
	CacheFailureResult,
	CacheItem,
	CacheItems,
	CacheResult,
	CacheStats,
	CacheSuccessResult,
	MethodParams,
	MethodReturn,
	Namespace,
} from "../types/index.js";
import { formatZodErrors, getLoggerFromContext } from "../utils/index.js";

export interface ICacheService {
	delete(args: { key: string }): CacheResult;
	deleteMany(args: { keys: Array<string> }): Array<CacheResult>;
	flush(): void;
	flushStats(): void;
	get<T>(args: { key: string }): CacheResult<T | undefined>;
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

	public delete(
		args: MethodParams<ICacheService, "delete">,
	): MethodReturn<ICacheService, "delete"> {
		const logger = this._getLogger({ method: "delete" });
		logger.debug({ key: args.key }, "Deleting cache key");

		const parsedKey = this._validateSchema({
			data: args.key,
			schema: cacheKeySchema,
		});

		logger.debug({ parsedKey }, "Validated cache key");

		const key = this._generateCacheKey({ id: parsedKey });

		logger.debug({ key }, "Generated cache key");

		try {
			const result = this._cache.del(key) === 0 ? false : true;

			if (!result) {
				logger.warn({ key }, "Cache key not found");

				return this._createFailureResult(key, CacheOperationError.delete(key));
			}

			logger.info({ key }, "Cache item deleted successfully");

			return this._createSuccessResult(key);
		} catch (error) {
			logger.error(
				{ error, key },
				"Unexpected error occurred while deleting cache item",
			);

			return this._createFailureResult(
				key,
				CacheOperationError.delete(key, error),
			);
		}
	}

	public deleteMany(
		args: MethodParams<ICacheService, "deleteMany">,
	): MethodReturn<ICacheService, "deleteMany"> {
		const logger = this._getLogger({ method: "deleteMany" });

		logger.debug({ keys: args.keys }, "Deleting cache keys");

		const parsedKeys = this._validateSchema({
			data: args.keys,
			schema: cacheKeysSchema,
		});

		logger.debug({ parsedKeys }, "Validated cache keys");

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

	public flush(): MethodReturn<ICacheService, "flush"> {
		const logger = this._getLogger({ method: "flush" });

		try {
			this._cache.flushAll();
			logger.info("Cache flushed successfully");
		} catch (error) {
			logger.error({ error }, "Failed to flush cache");

			throw CacheOperationError.flush(error);
		}
	}

	public flushStats(): MethodReturn<ICacheService, "flushStats"> {
		const logger = this._getLogger({ method: "flushStats" });

		this._cache.flushStats();
		logger.info("Cache stats flushed successfully");
	}

	public get<T>(
		args: MethodParams<ICacheService, "get">,
	): CacheResult<T | undefined> {
		const logger = this._getLogger({ method: "get" });

		logger.debug({ key: args.key }, "Getting cache item");

		const parsedKey = this._validateSchema({
			data: args.key,
			schema: cacheKeySchema,
		});

		logger.debug({ parsedKey }, "Validated cache key");

		const key = this._generateCacheKey({ id: parsedKey });

		logger.debug({ key }, "Generated cache key");

		try {
			const result = this._cache.get<T>(key);
			if (!result) {
				logger.info({ key: args.key }, "Cache miss");
				return this._createSuccessResult(undefined);
			}

			logger.info({ key: args.key }, "Cache hit");
			return this._createSuccessResult(result);
		} catch (error) {
			logger.error({ error, key }, "Failed to get cache item");

			return this._createFailureResult(
				key,
				CacheOperationError.get(key, error),
			);
		}
	}

	public getKeys(): MethodReturn<ICacheService, "getKeys"> {
		const logger = this._getLogger({ method: "getKeys" });

		const keys = this._cache.keys();
		logger.debug({ keys }, "Retrieved cache keys");

		return keys;
	}

	public getMany<T>(
		args: MethodParams<ICacheService, "getMany">,
	): Array<CacheResult<T>> {
		const logger = this._getLogger({ method: "getMany" });

		logger.debug({ keys: args.keys }, "Getting cache items");

		const parsedKeys = this._validateSchema({
			data: args.keys,
			schema: cacheKeysSchema,
		});

		logger.debug({ parsedKeys }, "Validated cache keys");

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

	public getStats(): MethodReturn<ICacheService, "getStats"> {
		const logger = this._getLogger({ method: "getStats" });

		const stats = this._cache.getStats();

		logger.debug({ stats }, "Retrieved cache stats");

		return {
			hits: stats.hits,
			keysSize: stats.ksize,
			misses: stats.misses,
			numberOfKeys: stats.keys,
			totalSize: stats.vsize + stats.ksize,
			valuesSize: stats.vsize,
		};
	}

	public isKeyCached(
		args: MethodParams<ICacheService, "isKeyCached">,
	): MethodReturn<ICacheService, "isKeyCached"> {
		const logger = this._getLogger({ method: "isKeyCached" });

		logger.debug({ key: args.key }, "Checking if key is cached");

		const parsedKey = this._validateSchema({
			data: args.key,
			schema: cacheKeySchema,
		});

		logger.debug({ parsedKey }, "Validated cache key");

		const key = this._generateCacheKey({ id: parsedKey });

		logger.debug({ key }, "Generated cache key");

		try {
			const result = this._cache.has(key);
			if (!result) {
				logger.warn({ key }, "Cache key not found");
				return this._createFailureResult(key, CacheOperationError.has(key));
			}

			logger.info({ key }, "Cache key found");
			return this._createSuccessResult(key);
		} catch (error) {
			logger.error({ error, key }, "Failed to check if key is cached");

			return this._createFailureResult(
				key,
				CacheOperationError.has(key, error),
			);
		}
	}

	public set(
		args: MethodParams<ICacheService, "set">,
	): MethodReturn<ICacheService, "set"> {
		const logger = this._getLogger({ method: "set" });

		logger.debug({ key: args.key, ttl: args.ttl }, "Setting cache item");

		const parsedArgs = this._validateSchema({
			data: {
				key: args.key,
				ttl: args.ttl ?? DEFAULT_CACHE_CONFIG.stdTTL,
				val: args.value,
			},
			schema: cacheItemSchema,
		});

		logger.debug({ parsedArgs }, "Validated cache item");

		this._validateMemoryCapacity(1);

		logger.debug("Validated memory capacity");

		const key = this._generateCacheKey({ id: parsedArgs.key });

		logger.debug({ key }, "Generated cache key");

		try {
			const result = this._cache.set(key, parsedArgs.val, parsedArgs.ttl);
			if (!result) {
				logger.warn({ key }, "Failed to set cache item");
				return this._createFailureResult(key, CacheOperationError.set(key));
			}

			logger.info({ key }, "Cache item set successfully");

			return this._createSuccessResult(key);
		} catch (error) {
			logger.error({ error, key }, "Failed to set cache item");

			return this._createFailureResult(
				key,
				CacheOperationError.set(key, error),
			);
		}
	}

	public setMany(
		args: MethodParams<ICacheService, "setMany">,
	): MethodReturn<ICacheService, "setMany"> {
		const logger = this._getLogger({ method: "setMany" });
		logger.debug({ items: args }, "Setting cache items");

		this._validateMemoryCapacity(args.length);

		logger.debug("Validated memory capacity");

		const parsedArgs = this._validateSchema({
			data: args.map((arg) => ({
				key: arg.key,
				ttl: arg.ttl ?? DEFAULT_CACHE_CONFIG.stdTTL,
				val: arg.value,
			})),
			schema: cacheItemsSchema,
		});

		logger.debug({ parsedArgs }, "Validated cache items");

		const parsedArgsWithCacheKeys = parsedArgs.map((arg) => ({
			...arg,
			key: this._generateCacheKey({ id: arg.key }),
		}));

		logger.debug({ parsedArgsWithCacheKeys }, "Generated cache keys");

		return parsedArgsWithCacheKeys.map((arg) => {
			try {
				const result = this._cache.set(arg.key, arg.val, arg.ttl);
				if (!result) {
					logger.error({ key: arg.key }, "Failed to set cache item");
					return this._createFailureResult(
						arg.key,
						CacheOperationError.set(arg.key),
					);
				}

				return this._createSuccessResult(arg.key);
			} catch (error) {
				logger.error({ error, key: arg.key }, "Failed to set cache item");
				return this._createFailureResult(
					arg.key,
					CacheOperationError.set(arg.key, error),
				);
			}
		});
	}

	public take<T>(args: MethodParams<ICacheService, "take">): CacheResult<T> {
		const logger = this._getLogger({ method: "take" });

		logger.debug({ key: args.key }, "Taking cache item");

		const parsedKey = this._validateSchema({
			data: args.key,
			schema: cacheKeySchema,
		});

		logger.debug({ parsedKey }, "Validated cache key");

		const key = this._generateCacheKey({ id: parsedKey });

		logger.debug({ key }, "Generated cache key");

		try {
			const result = this._cache.take<T>(key);
			if (!result) {
				logger.warn({ key: args.key }, "Cache miss");
				return this._createFailureResult(key, CacheOperationError.take(key));
			}

			logger.info({ key: args.key }, "Cache item taken successfully");

			return this._createSuccessResult(result);
		} catch (error) {
			logger.error({ error, key }, "Failed to take cache item");
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

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({
			layer: "cache service",
			...args,
		});
	}

	private _validateMemoryCapacity(batchSize: number): void {
		const logger = this._getLogger({ method: "_validateMemoryCapacity" });

		if (batchSize === 0) {
			return;
		}
		if (batchSize > MAX_CACHE_SIZE) {
			logger.error(
				{ batchSize, maxCacheSize: MAX_CACHE_SIZE },
				"Batch size exceeds maximum cache size",
			);
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
			logger.warn(
				{
					availableSpace,
					batchSize,
					deletedCount: keysToDelete.length,
					maxCacheSize: MAX_CACHE_SIZE,
					spaceNeeded,
					usedCacheSpace,
				},
				"Cache capacity limit reached, deleted oldest keys",
			);
		} catch (error) {
			logger.error(
				{ error, keysToDelete },
				"Failed to delete keys during cache deleting",
			);
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
