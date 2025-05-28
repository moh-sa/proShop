import { ErrorType } from "../types";
import { JwtBaseError } from "./base.error";

export class JwtTokenExpiredError extends JwtBaseError {
  constructor(details?: Record<string, unknown>) {
    super("JWT token expired", ErrorType.AUTHENTICATION, 401, details);
  }
}
