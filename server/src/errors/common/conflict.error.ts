import { ErrorType } from "../../types/index.js";
import { BaseError } from "../base.error.js";

export class ConflictError extends BaseError {
	constructor(message: string) {
		super(message, ErrorType.CONFLICT, 409);
	}
}
