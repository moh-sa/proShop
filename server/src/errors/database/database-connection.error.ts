import { ErrorType } from "../../types/index.js";
import { DatabaseBaseError } from "./database-base.error.js";

export class DatabaseConnectionError extends DatabaseBaseError {
  constructor(
    message: string = "Database connection failed",
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorType.DATABASE_ERROR, 500, details);
  }
}
