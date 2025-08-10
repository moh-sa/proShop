import { ErrorType } from "../types/index.js";
import { BaseError } from "./base.error.js";

export class InternalError extends BaseError {
  constructor(message: string = "Internal server error") {
    super(message, ErrorType.INTERNAL, 500);
  }
}
