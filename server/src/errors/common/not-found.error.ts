import { ErrorType } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class NotFoundError extends BaseError {
	constructor(resource: string) {
		super(`${resource} not found`, ErrorType.NOT_FOUND, 404);
	}
}
