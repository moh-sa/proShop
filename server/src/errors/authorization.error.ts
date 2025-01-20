import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class AuthorizationError extends BaseError {
  constructor(message: string = "Insufficient permissions") {
    super(message, ErrorType.AUTHORIZATION, 403);
  }
}
