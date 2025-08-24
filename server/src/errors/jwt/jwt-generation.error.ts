import { ErrorType } from "../../types/index.js";
import { JwtBaseError } from "./jwt-base.error.js";

export class JwtGenerationError extends JwtBaseError {
	constructor(details: Record<string, unknown> = {}) {
		super(
			"Failed to generate JWT token",
			ErrorType.JWT_GENERATION,
			500,
			details,
		);
	}
}
