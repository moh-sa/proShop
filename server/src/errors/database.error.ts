import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class DatabaseError extends BaseError {
  constructor(message: string = "Database operation failed") {
    super(message, ErrorType.DATABASE_ERROR, 500);
  }
}
