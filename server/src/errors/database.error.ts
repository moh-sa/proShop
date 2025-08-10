import { ErrorType } from "../types/index.js";
import { BaseError } from "./base.error.js";

export class DatabaseError extends BaseError {
  constructor(message: string = "Database operation failed") {
    super(message, ErrorType.DATABASE_ERROR, 500);
  }
}
