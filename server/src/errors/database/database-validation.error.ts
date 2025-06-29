import { ErrorType } from "../../types";
import { DatabaseBaseError } from "./database-base.error";

export class DatabaseValidationError extends DatabaseBaseError {
  constructor(
    message: string = "Database validation failed",
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorType.DATABASE_ERROR, 400, details);
  }
}
