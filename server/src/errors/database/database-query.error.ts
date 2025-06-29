import { ErrorType } from "../../types";
import { DatabaseBaseError } from "./database-base.error";

export class DatabaseQueryError extends DatabaseBaseError {
  constructor(
    message: string = "Database query failed",
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorType.DATABASE_ERROR, 500, details);
  }
}
