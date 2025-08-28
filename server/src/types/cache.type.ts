import type NodeCache from "node-cache";

import type { CacheBaseError } from "../errors/index.js";
import type { FailureResult, SuccessResult } from "./result.type.js";

export type CacheConfig = NodeCache.Options;

export type CacheFailureResult<T, E = CacheBaseError> = FailureResult<E> & {
	key: T;
};

export type CacheItem = { key: string; ttl?: number; value: unknown };

export type CacheItems = Array<CacheItem>;
export type CacheResult<
	SuccessPayload = string,
	FailurePayload = string,
	E = CacheBaseError,
> = CacheFailureResult<FailurePayload, E> | CacheSuccessResult<SuccessPayload>;

export type CacheStats = {
	hits: number;
	keysSize: number;
	misses: number;
	numberOfKeys: number;
	totalSize: number;
	valuesSize: number;
};
export type CacheSuccessResult<T> = SuccessResult<T>;
export type Namespace = "order" | "product" | "rate-limit" | "user";
