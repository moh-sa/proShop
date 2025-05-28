import { ErrorType } from "../types";
import { JwtBaseError } from "./base.error";

export class InvalidJwtTokenPayloadError extends JwtBaseError {
  constructor(details?: Record<string, unknown>) {
    super("Invalid JWT token payload", ErrorType.AUTHENTICATION, 401, details);
  }
}
