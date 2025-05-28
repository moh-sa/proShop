import { ErrorType } from "../types";
import { JwtBaseError } from "./base.error";

export class JwtVerificationError extends JwtBaseError {
  constructor(details?: Record<string, unknown>) {
    super("JWT verification failed", ErrorType.AUTHENTICATION, 401, details);
  }
}
