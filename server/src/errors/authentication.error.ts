import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class AuthenticationError extends BaseError {
  constructor(message: string = "Authentication required") {
    super(message, ErrorType.AUTHENTICATION, 401);
  }
}
