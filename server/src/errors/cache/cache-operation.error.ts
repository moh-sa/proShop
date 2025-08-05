import { ErrorType } from "../../types";
import { CacheBaseError } from "./cache-base.error";

type CacheOperation = "GET" | "SET" | "DELETE" | "FLUSH" | "TAKE" | "HAS";

export class CacheOperationError extends CacheBaseError {
  readonly operation: CacheOperation;

  constructor(
    operation: CacheOperation,
    message: string,
    details?: { key?: string; keys?: string[]; cause?: unknown },
  ) {
    super(
      `Cache ${operation.toLowerCase()} failed: ${message}`,
      ErrorType.CACHE_ERROR,
      500,
      details,
    );
    this.operation = operation;
  }

  static set(key: string, cause?: unknown) {
    return new CacheOperationError("SET", "Failed to set cache value", {
      key,
      cause,
    });
  }

  static get(key: string, cause?: unknown) {
    return new CacheOperationError("GET", "Failed to retrieve cache value", {
      key,
      cause,
    });
  }

  static delete(keys: string | Array<string>, cause?: unknown) {
    return new CacheOperationError("DELETE", "Failed to delete cache value", {
      key: Array.isArray(keys) ? undefined : keys,
      keys: Array.isArray(keys) ? keys : undefined,
      cause,
    });
  }

  static take(key: string, cause?: unknown) {
    return new CacheOperationError("TAKE", "Failed to take cache value", {
      key,
      cause,
    });
  }

  static has(key: string, cause?: unknown) {
    return new CacheOperationError("HAS", "Failed to check if key is cached", {
      key,
      cause,
    });
  }

  static flush(cause?: unknown) {
    return new CacheOperationError("FLUSH", "Failed to flush cache", { cause });
  }
}
