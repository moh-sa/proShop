import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class ConflictError extends BaseError {
	constructor(message: string) {
		super(message, ERROR_TYPE.CONFLICT, HTTP_STATUS.CONFLICT);
	}
}
