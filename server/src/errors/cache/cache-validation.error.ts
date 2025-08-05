import { ErrorType } from "../../types";
import { CacheBaseError } from "./cache-base.error";

export class CacheValidationError extends CacheBaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      `Cache validation failed: ${message}`,
      ErrorType.VALIDATION,
      400,
      details,
    );
  }

  static invalidKey(key: string) {
    return new CacheValidationError("Invalid cache key format", { key });
  }

  static invalidTTL(ttl: number) {
    return new CacheValidationError("Invalid TTL value", { ttl });
  }
}
