import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorType.VALIDATION, 400, details);
  }
}
