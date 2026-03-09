import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { BaseError } from "../base.error.js";

export class NotFoundError extends BaseError {
	constructor(resource: string) {
		super(`${resource} not found`, ERROR_TYPE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	}
}
