import { ErrorType } from "../types/index.js";
import { JwtBaseError } from "./base.error.js";

export class InvalidJwtTokenError extends JwtBaseError {
  constructor(details?: Record<string, unknown>) {
    super("Invalid JWT token format", ErrorType.AUTHENTICATION, 401, details);
  }
}
