import { ErrorType } from "../../constants/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtInvalidTokenError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Invalid JWT token format",
			ErrorType.JWT_INVALID_TOKEN,
			401,
			details,
		);
	}
}
