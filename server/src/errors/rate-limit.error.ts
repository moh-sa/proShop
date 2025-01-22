import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class RateLimitError extends BaseError {
  constructor(message: string = "Too many requests") {
    super(message, ErrorType.RATE_LIMIT, 429);
  }
}
