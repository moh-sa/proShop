import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtVerificationError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Failed to verify JWT token",
			ERROR_TYPE.JWT_VERIFICATION,
			HTTP_STATUS.UNAUTHORIZED,
			details,
		);
	}
}
