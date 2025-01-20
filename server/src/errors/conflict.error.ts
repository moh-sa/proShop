import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.CONFLICT, 409);
  }
}
