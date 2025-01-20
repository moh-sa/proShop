import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class InternalError extends BaseError {
  constructor(message: string = "Internal server error") {
    super(message, ErrorType.INTERNAL, 500);
  }
}
