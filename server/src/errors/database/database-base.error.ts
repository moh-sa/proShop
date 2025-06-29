import { ErrorType } from "../../types";
import { BaseError } from "../base.error";

export class DatabaseBaseError extends BaseError {
  constructor(
    message: string,
    errorType: ErrorType,
    statusCode: number,
    details?: Record<string, unknown>,
  ) {
    super(message, errorType, statusCode, details);
  }
}
