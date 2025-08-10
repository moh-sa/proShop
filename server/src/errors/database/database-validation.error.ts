import { ErrorType } from "../../types/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseValidationError extends DatabaseBaseError {
  constructor(
    message: string = "Database validation failed",
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorType.DATABASE_ERROR, 400, details);
  }
}
