import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtInvalidPayloadError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Invalid JWT token payload",
			ERROR_TYPE.JWT_INVALID_PAYLOAD,
			HTTP_STATUS.UNAUTHORIZED,
			details,
		);
	}
}
