import { ErrorType } from "../types/index.js";
import { JwtBaseError } from "./base.error.js";

export class JwtVerificationError extends JwtBaseError {
  constructor(details?: Record<string, unknown>) {
    super("JWT verification failed", ErrorType.AUTHENTICATION, 401, details);
  }
}
