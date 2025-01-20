import { ErrorType } from "../types";
import { BaseError } from "./base.error";

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super(`${resource} not found`, ErrorType.NOT_FOUND, 404);
  }
}
