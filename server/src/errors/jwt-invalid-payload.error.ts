import { ErrorType } from "../types/index.js";
import { JwtBaseError } from "./base.error.js";

export class InvalidJwtTokenPayloadError extends JwtBaseError {
  constructor(details?: Record<string, unknown>) {
    super("Invalid JWT token payload", ErrorType.AUTHENTICATION, 401, details);
  }
}
