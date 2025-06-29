import { ErrorType } from "../../types";
import { DatabaseBaseError } from "./database-base.error";

export class DatabaseTimeoutError extends DatabaseBaseError {
  constructor(
    message: string = "Database operation timed out",
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorType.DATABASE_ERROR, 504, details);
  }
}
