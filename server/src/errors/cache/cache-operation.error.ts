import { ErrorType } from "../../types/index.js";
import { CacheBaseError } from "./cache-base.error.js";

type CacheOperation = "DELETE" | "FLUSH" | "GET" | "HAS" | "SET" | "TAKE";

export class CacheOperationError extends CacheBaseError {
  readonly operation: CacheOperation;

  constructor(
    operation: CacheOperation,
    message: string,
    details?: { cause?: unknown; key?: string; keys?: Array<string> },
  ) {
    super(
      `Cache ${operation.toLowerCase()} failed: ${message}`,
      ErrorType.CACHE_ERROR,
      500,
      details,
    );
    this.operation = operation;
  }

  static delete(keys: Array<string> | string, cause?: unknown) {
    return new CacheOperationError("DELETE", "Failed to delete cache value", {
      cause,
      key: Array.isArray(keys) ? undefined : keys,
      keys: Array.isArray(keys) ? keys : undefined,
    });
  }

  static flush(cause?: unknown) {
    return new CacheOperationError("FLUSH", "Failed to flush cache", { cause });
  }

  static get(key: string, cause?: unknown) {
    return new CacheOperationError("GET", "Failed to retrieve cache value", {
      cause,
      key,
    });
  }

  static has(key: string, cause?: unknown) {
    return new CacheOperationError("HAS", "Failed to check if key is cached", {
      cause,
      key,
    });
  }

  static set(key: string, cause?: unknown) {
    return new CacheOperationError("SET", "Failed to set cache value", {
      cause,
      key,
    });
  }

  static take(key: string, cause?: unknown) {
    return new CacheOperationError("TAKE", "Failed to take cache value", {
      cause,
      key,
    });
  }
}
