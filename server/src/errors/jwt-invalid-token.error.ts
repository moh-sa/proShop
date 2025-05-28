import { ErrorType } from "../types";
import { JwtBaseError } from "./base.error";

export class InvalidJwtTokenError extends JwtBaseError {
  constructor(details?: Record<string, unknown>) {
    super("Invalid JWT token format", ErrorType.AUTHENTICATION, 401, details);
  }
}
