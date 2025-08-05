import NodeCache from "node-cache";
import { CacheBaseError } from "../errors";
import { FailureResult, SuccessResult } from "./result.type";

export type Namespace = "product" | "user" | "order" | "rate-limit";

export type CacheConfig = NodeCache.Options;

export type CacheStats = {
  hits: number;
  misses: number;
  numberOfKeys: number;
  keysSize: number;
  valuesSize: number;
  totalSize: number;
};

export type CacheItem = { key: string; value: {}; ttl?: number };
export type CacheItems = Array<CacheItem>;

export type CacheSuccessResult<T> = SuccessResult<T>;
export type CacheFailureResult<T, E = CacheBaseError> = FailureResult<E> & {
  key: T;
};
export type CacheResult<
  SuccessPayload = string,
  FailurePayload = string,
  E = CacheBaseError,
> = CacheSuccessResult<SuccessPayload> | CacheFailureResult<FailurePayload, E>;
