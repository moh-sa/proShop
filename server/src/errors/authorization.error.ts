import { ErrorType } from "../types/index.js";
import { BaseError } from "./base.error.js";

export class AuthorizationError extends BaseError {
  constructor(message: string = "Insufficient permissions") {
    super(message, ErrorType.AUTHORIZATION, 403);
  }
}
