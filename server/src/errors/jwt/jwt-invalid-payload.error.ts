import { ErrorType } from "../../constants/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtInvalidPayloadError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Invalid JWT token payload",
			ErrorType.JWT_INVALID_PAYLOAD,
			401,
			details,
		);
	}
}
