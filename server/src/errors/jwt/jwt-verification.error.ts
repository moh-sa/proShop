import { ErrorType } from "../../types/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtVerificationError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Failed to verify JWT token",
			ErrorType.JWT_VERIFICATION,
			401,
			details,
		);
	}
}
