import { ERROR_TYPE, HTTP_STATUS } from "../../constants/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtGenerationError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Failed to generate JWT token",
			ERROR_TYPE.JWT_GENERATION,
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
			details,
		);
	}
}
