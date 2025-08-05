import { ErrorType } from "../../types";
import { BaseError } from "../base.error";

export abstract class CacheBaseError extends BaseError {
  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    details?: Record<string, unknown>,
  ) {
    super(message, type, statusCode, details);
  }
}
