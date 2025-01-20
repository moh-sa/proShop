import { ErrorType } from "../types";

export class BaseError extends Error {
  constructor(
    public readonly message: string,
    public readonly type: ErrorType,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
